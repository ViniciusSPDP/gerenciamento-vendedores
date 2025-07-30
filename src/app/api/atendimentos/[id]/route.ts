// src/app/api/atendimentos/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, StatusAtendimento } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'VENDEDOR') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Aguarde a resolução dos params
  const { id } = await params;
  const { status } = (await request.json()) as { status: StatusAtendimento };

  if (!['VAI_ATENDER', 'NAO_CONSIGO_ATENDER'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
  }

  try {
    const atendimento = await prisma.atendimento.findUnique({
      where: { id },
    });

    if (!atendimento || atendimento.vendedorId !== session.user.id) {
      return NextResponse.json({ error: 'Atendimento não encontrado ou não pertence a você.' }, { status: 403 });
    }

    const updatedAtendimento = await prisma.atendimento.update({
      where: {
        id,
      },
      data: {
        status: status,
        dataResposta: new Date(),
      },
    });

    return NextResponse.json(updatedAtendimento, { status: 200 });

  } catch (error) {
    console.error('Falha ao atualizar atendimento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}