// src/app/dashboard/page.tsx

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth"; // Importa as opções de autenticação
import AtendimentoListComponent from "./AtendimentoListComponent";

const prisma = new PrismaClient();

// Esta é a Server Component principal da página
export default async function DashboardPage() {
  // 1. Proteger a rota e obter dados do usuário
  const session = await getServerSession(authOptions);

  // Se não estiver logado ou não for um VENDEDOR, volta para o login
  if (!session || session.user.role !== "VENDEDOR") {
    redirect("/login");
  }

  // 2. Buscar os atendimentos PENDENTES apenas para este vendedor
  const atendimentosPendentes = await prisma.atendimento.findMany({
    where: {
      vendedorId: session.user.id,
      status: "PENDENTE",
    },
    // Incluir os dados do cliente em cada atendimento
    include: {
      cliente: true, 
    },
    orderBy: {
      dataImportacao: 'desc', // Mostrar os mais recentes primeiro
    }
  });

  return (
    <main className="bg-gray-100 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Seus Atendimentos Pendentes</h1>
          <p className="text-gray-600">
            {atendimentosPendentes.length > 0 
              ? `Você tem ${atendimentosPendentes.length} cliente(s) para analisar.`
              : "Você não tem nenhum atendimento pendente. Bom trabalho!"}
          </p>
        </div>
        
        {/* Passamos os dados para o componente de cliente que cuidará da interação */}
        <AtendimentoListComponent initialAtendimentos={atendimentosPendentes} />
      </div>
    </main>
  );
}