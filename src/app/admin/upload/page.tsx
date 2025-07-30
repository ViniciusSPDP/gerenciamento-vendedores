// src/app/admin/upload/page.tsx

import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import UploadClientComponent from "./UploadClientComponent";
import Link from "next/link";

// Ícone para o botão de voltar
const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
    </svg>
);

// Esta é uma Server Component, responsável por proteger a rota
export default async function AdminUploadPage() {
  // 1. Proteger a rota
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // 2. Renderizar o componente de cliente que terá toda a interatividade
  return (
    <main className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* --- Cabeçalho com Botão de Voltar --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold text-gray-900">Upload de Planilha de Clientes</h1>
                <p className="mt-1 text-gray-600">
                    Siga os passos abaixo para importar os dados para o sistema.
                </p>
            </div>
            <Link href="/admin/dashboard" className="mt-4 sm:mt-0 self-start sm:self-center">
                <button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                    <ArrowLeftIcon className="h-5 w-5" />
                    Voltar ao Dashboard
                </button>
            </Link>
        </div>
        <UploadClientComponent />
      </div>
    </main>
  );
}
