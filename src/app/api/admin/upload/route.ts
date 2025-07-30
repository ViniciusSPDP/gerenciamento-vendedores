// src/app/api/admin/upload/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Papa from "papaparse";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// --- Definindo um tipo para os erros para manter o código limpo ---
type ProcessingError = {
    line: number;
    data: Record<string, string | undefined>;
    reason: string;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const mapping = JSON.parse(formData.get("mapping") as string);

    if (!file) {
      return NextResponse.json({ message: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const fileContent = await file.text();
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });
    
    const rows = parseResult.data as { [key: string]: string }[];
    
    const todosVendedores = await prisma.user.findMany({ where: { role: 'VENDEDOR' } });
    const vendedoresMap = new Map(todosVendedores.map(v => [v.username, v]));

    const processingReport = {
        successCount: 0,
        errorCount: 0,
        skippedCount: 0,
        errors: [] as ProcessingError[],
    };

    for (const [index, row] of rows.entries()) {
        const lineNumber = index + 2;

        try {
            const nomeVendedor = row[mapping.nome_vendedor];
            const cnpjCliente = row[mapping.cnpj];
            const razaoSocial = row[mapping.razao_social];
            const municipio = row[mapping.municipio];
            const situacaoCredito = row[mapping.situacao_credito];
            const faturamentoStr = row[mapping.faturamento] || '0';
            const comparativo = row[mapping.comparativo];

            if (!nomeVendedor || !cnpjCliente || !razaoSocial) {
                throw new Error("Dados essenciais (Vendedor, CNPJ ou Razão Social) faltando.");
            }
            
            const vendedor = vendedoresMap.get(nomeVendedor);
            if (!vendedor) {
                throw new Error(`Vendedor '${nomeVendedor}' não encontrado no sistema.`);
            }

            // Parse do faturamento no formato brasileiro (ex: "1.755,96")
            // Remove pontos (separadores de milhares) e substitui vírgula por ponto (decimal)
            const faturamentoLimpo = faturamentoStr.replace(/\./g, '').replace(',', '.');
            const faturamento = parseFloat(faturamentoLimpo) || 0;
            const faturamentoVazioOuZero = !faturamentoStr || faturamentoStr.trim() === '' || faturamento === 0;
            
            // Pula clientes bloqueados
            if (situacaoCredito?.toUpperCase() === 'BLOQUEADO') {
                processingReport.skippedCount++;
                continue;
            }

            // NOVA LÓGICA: Precisa atender se:
            // 1. Comparativo = "VER" E faturamento é 0/nulo/vazio
            // 2. OU faturamento é 0/nulo/vazio (independente do comparativo)
            const comparativoVer = comparativo?.toUpperCase() === 'VER';
            const precisaAtender = (comparativoVer && faturamentoVazioOuZero) || faturamentoVazioOuZero;

            if (precisaAtender) {
                const cliente = await prisma.cliente.upsert({
                    where: { cnpj: cnpjCliente },
                    update: { razaoSocial, municipio, situacaoCredito },
                    create: {
                        cnpj: cnpjCliente,
                        razaoSocial,
                        municipio,
                        situacaoCredito: situacaoCredito || '',
                    },
                });

                await prisma.atendimento.create({
                    data: {
                        faturamento,
                        comparativo: comparativo || '',
                        status: 'PENDENTE',
                        vendedorId: vendedor.id,
                        clienteId: cliente.id,
                    },
                });
                processingReport.successCount++;
            } else {
                processingReport.skippedCount++;
            }
        } catch (error) {
            processingReport.errorCount++;
            let reason = 'Erro desconhecido no banco de dados.';
            if (error instanceof Error) {
                reason = error.message;
            }
            processingReport.errors.push({
                line: lineNumber,
                data: { CNPJ: row[mapping.cnpj], "Razão Social": row[mapping.razao_social] },
                reason: reason,
            });
        }
    }

    let message = `Processamento concluído! ${processingReport.successCount} atendimentos criados.`;
    if (processingReport.errorCount > 0) {
        message += ` ${processingReport.errorCount} linhas falharam.`;
    }
    if (processingReport.skippedCount > 0) {
        message += ` ${processingReport.skippedCount} linhas foram ignoradas (não se encaixavam nos critérios).`;
    }

    return NextResponse.json({ 
        message,
        report: processingReport,
    }, { status: 200 });

  } catch (error) {
    console.error("Erro geral no processamento da planilha:", error);
    if (error instanceof Error) {
        return NextResponse.json({ message: "Falha crítica ao processar a planilha.", error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: "Falha crítica com um erro inesperado." }, { status: 500 });
  }
}