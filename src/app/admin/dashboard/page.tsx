// src/app/admin/dashboard/page.tsx

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import DashboardClientComponent from "./DashboardClientComponent";
import Link from "next/link";

const prisma = new PrismaClient();

// Ícone para o botão de upload
const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
    </svg>
);


// Definindo o tipo para nossas estatísticas processadas
export type VendedorStats = {
  id: string;
  nome: string;
  VAI_ATENDER: number;
  NAO_CONSIGO_ATENDER: number;
  FECHOU_CNPJ: number; // Novo campo para "Fechou CNPJ"
  PENDENTE: number;
  total: number;
};

// Esta é a Server Component principal da página
export default async function AdminDashboardPage() {
  // 1. Proteger a rota
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // 2. Buscar e processar os dados para o dashboard
  const vendedores = await prisma.user.findMany({
    where: { role: 'VENDEDOR' },
  });

  const statsAgrupadas = await prisma.atendimento.groupBy({
    by: ['vendedorId', 'status'],
    _count: {
      status: true,
    },
  });

  // 3. Transformar os dados para um formato fácil de usar na tabela
  const statsProcessadas: VendedorStats[] = vendedores.map(vendedor => {
    const statsDoVendedor = {
      id: vendedor.id,
      nome: vendedor.username,
      VAI_ATENDER: 0,
      NAO_CONSIGO_ATENDER: 0,
      PENDENTE: 0,
      FECHOU_CNPJ: 0, // Novo campo para "Fechou CNPJ",
      total: 0,
    };

    statsAgrupadas
      .filter(s => s.vendedorId === vendedor.id)
      .forEach(group => {
        statsDoVendedor[group.status] = group._count.status;
      });
      
    statsDoVendedor.total = statsDoVendedor.VAI_ATENDER + statsDoVendedor.NAO_CONSIGO_ATENDER + statsDoVendedor.PENDENTE;

    return statsDoVendedor;
  });

  return (
    <main className="bg-gray-100 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* --- Cabeçalho da Página com Botão de Ação --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 sm:mb-0">Dashboard de Atendimentos</h1>
          <Link href="/admin/upload">
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
              <UploadIcon className="h-5 w-5" />
              Nova Planilha
            </button>
          </Link>
        </div>
        
        {/* Passamos os dados processados para o componente de cliente */}
        <DashboardClientComponent stats={statsProcessadas} />
      </div>
    </main>
  );
}
