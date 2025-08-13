// src/app/api/atendimentos/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, StatusAtendimento } from '@prisma/client';
import { getServerSession } from 'next-auth';
// Assumindo que seu authOptions está em @/lib/auth, conforme seu código
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  // --- MUDANÇA 1: Corrigindo a tipagem dos parâmetros ---
  // Os parâmetros não são uma Promise, são um objeto direto.
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'VENDEDOR') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // O 'id' é acessado diretamente de params
  const { id: atendimentoId } = params;
  const { status } = (await request.json()) as { status: StatusAtendimento };

  // --- MUDANÇA 2: Adicionando o novo status à validação ---
  if (!['VAI_ATENDER', 'NAO_CONSIGO_ATENDER', 'FECHOU_CNPJ'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
  }

  try {
    const atendimento = await prisma.atendimento.findUnique({
      where: { id: atendimentoId },
    });

    if (!atendimento || atendimento.vendedorId !== session.user.id) {
      return NextResponse.json({ error: 'Atendimento não encontrado ou não pertence a você.' }, { status: 403 });
    }

    const updatedAtendimento = await prisma.atendimento.update({
      where: {
        id: atendimentoId,
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
