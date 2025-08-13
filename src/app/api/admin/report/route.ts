// src/app/api/admin/report/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient();

export async function GET() {
  // 1. Proteger a API
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Não autorizado', { status: 401 });
  }

  try {
    // 2. Buscar todos os atendimentos com dados do cliente e vendedor
    const todosAtendimentos = await prisma.atendimento.findMany({
      include: {
        cliente: true,
        vendedor: true,
      },
      orderBy: {
        vendedor: {
          username: 'asc',
        },
      },
    });

    // 3. Formatar os dados para um formato simples de planilha
    const dataForSheet = todosAtendimentos.map(at => ({
      'Vendedor': at.vendedor.username,
      'CNPJ Cliente': at.cliente.cnpj,
      'Razão Social': at.cliente.razaoSocial,
      'Município': at.cliente.municipio,
      'Faturamento Importado': at.faturamento,
      'Comparativo Importado': at.comparativo,
      'Status da Resposta': at.status,
      'Data da Importação': at.dataImportacao.toLocaleDateString('pt-BR'),
      'Data da Resposta': at.dataResposta ? at.dataResposta.toLocaleDateString('pt-BR') : 'N/A',
    }));

    // 4. Criar a planilha em memória usando a biblioteca xlsx
    const worksheet = xlsx.utils.json_to_sheet(dataForSheet);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Relatorio de Atendimentos");
    
    // Definir largura das colunas (opcional, mas melhora a aparência)
    worksheet['!cols'] = [
      { wch: 20 }, // Vendedor
      { wch: 20 }, // CNPJ
      { wch: 40 }, // Razão Social
      { wch: 25 }, // Município
      { wch: 20 }, // Faturamento
      { wch: 20 }, // Comparativo
      { wch: 20 }, // Status
      { wch: 20 }, // Data Importação
      { wch: 20 }, // Data Resposta
    ];

    const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // 5. Enviar o buffer como resposta com os headers corretos para download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="relatorio_atendimentos.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error) {
    console.error('Falha ao gerar relatório:', error);
    return new NextResponse('Erro interno do servidor', { status: 500 });
  }
}