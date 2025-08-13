// src/app/dashboard/AtendimentoListComponent.tsx
"use client";

import { useState } from 'react';
import { Prisma } from '@prisma/client';

type AtendimentoComCliente = Prisma.AtendimentoGetPayload<{
  include: { cliente: true }
}>;

interface Props {
  initialAtendimentos: AtendimentoComCliente[];
}

// --- Ícones para os motivos (SVG embutido) ---
const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);
const AlertIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.37-1.21 3.006 0l5.416 10.33c.636 1.21-.26 2.72-1.503 2.72H4.344c-1.243 0-2.139-1.51-1.503-2.72l5.416-10.33zM9 6a1 1 0 011 1v3a1 1 0 11-2 0V7a1 1 0 011-1zm1 6a1 1 0 10-2 0 1 1 0 002 0z" clipRule="evenodd" />
  </svg>
);


export default function AtendimentoListComponent({ initialAtendimentos }: Props) {
  const [atendimentos, setAtendimentos] = useState(initialAtendimentos);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // --- MUDANÇA 1: Adicionando o novo status 'FECHOU_CNPJ' ---
  const handleUpdateStatus = async (atendimentoId: string, status: 'VAI_ATENDER' | 'NAO_CONSIGO_ATENDER' | 'FECHOU_CNPJ') => {
    setLoadingId(atendimentoId);

    try {
      const response = await fetch(`/api/atendimentos/${atendimentoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar o status.');
      }
      setAtendimentos((prev) => prev.filter((at) => at.id !== atendimentoId));

    } catch (error) {
      console.error(error);
      alert('Não foi possível processar sua solicitação. Tente novamente.');
    } finally {
      setLoadingId(null);
    }
  };

  if (atendimentos.length === 0 && initialAtendimentos.length > 0) {
    return <p className="text-center text-gray-600 mt-10">Todos os atendimentos foram respondidos!</p>
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {atendimentos.map((at) => {
        let motivoInfo = {
          texto: '',
          corBorda: 'border-gray-200',
          corIcone: 'text-gray-400',
          Icone: InfoIcon,
        };
        if (at.comparativo?.toUpperCase() === 'VER') {
          motivoInfo = {
            texto: 'Cliente fora da sua cidade de atuação.',
            corBorda: 'border-blue-500',
            corIcone: 'text-blue-500',
            Icone: InfoIcon,
          };
        } else if (at.faturamento === 0) {
          motivoInfo = {
            texto: 'Cliente sem vendas nos últimos 2 meses.',
            corBorda: 'border-yellow-500',
            corIcone: 'text-yellow-500',
            Icone: AlertIcon,
          };
        }

        return (
          <div key={at.id} className={`bg-white rounded-xl shadow-lg overflow-hidden flex flex-col justify-between transition-transform hover:scale-[1.02] border-t-4 ${motivoInfo.corBorda}`}>
            <div className="p-5">
              {motivoInfo.texto && (
                <div className="flex items-center gap-2 mb-3">
                  <motivoInfo.Icone className={`h-5 w-5 flex-shrink-0 ${motivoInfo.corIcone}`} />
                  <p className="text-sm font-medium text-gray-700">{motivoInfo.texto}</p>
                </div>
              )}
              <h3 className="text-lg font-bold text-gray-900">{at.cliente.razaoSocial}</h3>
              <p className="text-sm text-gray-600 mb-4">CNPJ: {at.cliente.cnpj}</p>
              <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
                <p><span className="font-semibold text-gray-800">Município:</span> {at.cliente.municipio}</p>
                <p><span className="font-semibold text-gray-800">Sit. Crédito:</span> {at.cliente.situacaoCredito}</p>
                <p><span className="font-semibold text-gray-800">Faturamento:</span> R$ {at.faturamento.toFixed(2)}</p>
              </div>
            </div>

            {/* --- MUDANÇA 2: Layout dos botões alterado para lista vertical --- */}
            <div className="flex flex-col gap-2 p-3 bg-gray-50 border-t">
              <button
                onClick={() => handleUpdateStatus(at.id, 'VAI_ATENDER')}
                disabled={loadingId === at.id}
                className="w-full px-3 py-2.5 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                Atender
              </button>
              <button
                onClick={() => handleUpdateStatus(at.id, 'NAO_CONSIGO_ATENDER')}
                disabled={loadingId === at.id}
                className="w-full px-3 py-2.5 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
              >
                Não Consigo Atender
              </button>
              {/* --- MUDANÇA 3: Novo botão adicionado --- */}
              <button
                onClick={() => handleUpdateStatus(at.id, 'FECHOU_CNPJ')}
                disabled={loadingId === at.id}
                className="w-full px-3 py-2.5 text-sm font-bold text-white bg-gray-700 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
              >
                Fechou CNPJ
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
