// src/app/admin/dashboard/DashboardClientComponent.tsx
"use client";

import { useState, useMemo } from 'react';
import type { VendedorStats } from './page';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// --- Ícones para os cards de resumo ---
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>
);
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" /></svg>
);
const ListBulletIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.32-2.43a.75.75 0 01.04 1.06l-3 3a.75.75 0 01-1.06 0l-1.5-1.5a.75.75 0 111.06-1.06L10 11.69l2.47-2.47a.75.75 0 011.06-.04z" clipRule="evenodd" /></svg>
);
// Novo ícone para o card "Fechou CNPJ"
const ArchiveBoxXMarkIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V3.375c0-1.036-.84-1.875-1.875-1.875H5.625zM12.75 6a.75.75 0 00-1.5 0v6.19l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06l-1.72 1.72V6z" /></svg>
);


interface Props {
  stats: VendedorStats[];
}

export default function DashboardClientComponent({ stats }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  // --- MUDANÇA 1: Incluindo 'fechouCnpj' nos cálculos ---
  const summary = useMemo(() => {
    return stats.reduce((acc, vendedor) => {
      acc.total += vendedor.total;
      acc.atendidos += vendedor.VAI_ATENDER;
      acc.naoAtendidos += vendedor.NAO_CONSIGO_ATENDER;
      acc.pendentes += vendedor.PENDENTE;
      acc.fechouCnpj += vendedor.FECHOU_CNPJ;
      return acc;
    }, { total: 0, atendidos: 0, naoAtendidos: 0, pendentes: 0, fechouCnpj: 0 });
  }, [stats]);

  // --- MUDANÇA 2: Adicionando novo dado ao gráfico ---
  const chartData = [
    { name: 'Vai Atender', value: summary.atendidos, color: '#10B981' },
    { name: 'Não Atender', value: summary.naoAtendidos, color: '#EF4444' },
    { name: 'Pendentes', value: summary.pendentes, color: '#F59E0B' },
    { name: 'Fechou CNPJ', value: summary.fechouCnpj, color: '#6B7280' }, // Cinza
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/admin/report');
      if (!response.ok) throw new Error('Falha ao gerar o relatório.');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'relatorio_atendimentos.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Não foi possível exportar o relatório.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* --- MUDANÇA 3: Adicionando um novo card e ajustando o grid --- */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-5 rounded-xl shadow-lg flex items-center space-x-4"><div className="bg-indigo-100 p-3 rounded-full"><ListBulletIcon className="h-6 w-6 text-indigo-600" /></div><div><p className="text-sm font-medium text-gray-500">Total de Atendimentos</p><p className="text-2xl font-bold text-gray-900">{summary.total}</p></div></div>
        <div className="bg-white p-5 rounded-xl shadow-lg flex items-center space-x-4"><div className="bg-green-100 p-3 rounded-full"><CheckCircleIcon className="h-6 w-6 text-green-600" /></div><div><p className="text-sm font-medium text-gray-500">Respondidos</p><p className="text-2xl font-bold text-gray-900">{summary.atendidos + summary.naoAtendidos + summary.fechouCnpj}</p></div></div>
        <div className="bg-white p-5 rounded-xl shadow-lg flex items-center space-x-4"><div className="bg-yellow-100 p-3 rounded-full"><ClockIcon className="h-6 w-6 text-yellow-600" /></div><div><p className="text-sm font-medium text-gray-500">Pendentes</p><p className="text-2xl font-bold text-gray-900">{summary.pendentes}</p></div></div>
        <div className="bg-white p-5 rounded-xl shadow-lg flex items-center space-x-4"><div className="bg-gray-200 p-3 rounded-full"><ArchiveBoxXMarkIcon className="h-6 w-6 text-gray-600" /></div><div><p className="text-sm font-medium text-gray-500">Fechou CNPJ</p><p className="text-2xl font-bold text-gray-900">{summary.fechouCnpj}</p></div></div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg"><h2 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Status</h2><div style={{ width: '100%', height: 250 }}><ResponsiveContainer><PieChart><Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5}>{chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><Tooltip /><Legend iconType="circle" /></PieChart></ResponsiveContainer></div></div>
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4"><h2 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">Resumo por Vendedor</h2><button onClick={handleExport} disabled={isExporting} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors">{isExporting ? 'Exportando...' : 'Exportar Relatório'}</button></div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Atender</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Não Atender</th>
                  {/* --- MUDANÇA 4: Nova coluna na tabela --- */}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Fechou CNPJ</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pendentes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.map((vendedor) => (
                  <tr key={vendedor.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vendedor.nome}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-green-600 font-semibold">{vendedor.VAI_ATENDER}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-red-600 font-semibold">{vendedor.NAO_CONSIGO_ATENDER}</td>
                    {/* --- MUDANÇA 5: Novo dado na tabela --- */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-600 font-semibold">{vendedor.FECHOU_CNPJ}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-yellow-600 font-semibold">{vendedor.PENDENTE}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
