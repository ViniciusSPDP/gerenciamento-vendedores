// src/app/admin/upload/UploadClientComponent.tsx
"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import { useDropzone } from 'react-dropzone';

// --- Ícones para a UI ---
const UploadCloudIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M17.25 12c0 2.896-2.354 5.25-5.25 5.25S6.75 14.896 6.75 12 9.104 6.75 12 6.75s5.25 2.354 5.25 5.25z" />
    </svg>
);
const FileIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.667a2.002 2.002 0 00-.586-1.414l-4.25-4.25A2.002 2.002 0 0011.333 2H4zm5.5 3.5a1 1 0 00-1-1H5v2h3.5a1 1 0 001-1zM8.5 9a1 1 0 00-1-1H5v2h2.5a1 1 0 001-1zM5 13.5a1 1 0 011-1h6a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);


const REQUIRED_FIELDS = [
  "nome_vendedor",
  "razao_social",
  "cnpj",
  "faturamento",
  "municipio",
  "situacao_credito",
  "comparativo",
];

export default function UploadClientComponent() {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setMessage(null);
      Papa.parse(selectedFile, {
        preview: 1,
        complete: (results) => {
          setHeaders(results.data[0] as string[]);
          // Resetar o mapeamento ao selecionar novo arquivo
          setMapping({});
        },
      });
    } else {
        setMessage({ type: 'error', text: 'Por favor, selecione um arquivo no formato .csv' });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] }, multiple: false });

  const handleMappingChange = (systemField: string, csvHeader: string) => {
    setMapping((prev) => ({ ...prev, [systemField]: csvHeader }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mappedFields = Object.values(mapping).filter(Boolean);
    if (!file || mappedFields.length < REQUIRED_FIELDS.length) {
      setMessage({ type: 'error', text: "Por favor, selecione um arquivo e mapeie todos os campos obrigatórios." });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mapping", JSON.stringify(mapping));

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Ocorreu um erro no servidor.");
      setMessage({ type: 'success', text: result.message });
      setFile(null); // Limpa o formulário após sucesso
      setHeaders([]);
    } catch (error) {
      if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'Ocorreu um erro inesperado.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* --- Passo 1: Selecionar Arquivo --- */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Passo 1: Selecione o Arquivo</h2>
          <p className="text-sm text-gray-600 mb-4">Arraste e solte o arquivo CSV ou clique para selecionar.</p>
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isDragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-indigo-500'}`}
          >
            <input {...getInputProps()} />
            <UploadCloudIcon className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-center text-gray-600">
              {isDragActive ? 'Solte o arquivo aqui...' : 'Arraste o arquivo ou clique para selecionar'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Apenas arquivos .csv</p>
          </div>
          {file && (
            <div className="mt-4 flex items-center gap-3 bg-gray-100 p-3 rounded-lg">
                <FileIcon className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800 truncate">{file.name}</span>
                <button type="button" onClick={() => { setFile(null); setHeaders([]); }} className="ml-auto text-sm text-red-600 hover:text-red-800 font-semibold">Remover</button>
            </div>
          )}
        </section>

        {/* --- Passo 2: Mapear Colunas --- */}
        {headers.length > 0 && (
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Passo 2: Mapeie as Colunas</h2>
            <p className="text-sm text-gray-600 mb-6">Associe os campos do sistema com as colunas da sua planilha.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              {REQUIRED_FIELDS.map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                    {field.replace(/_/g, " ")}
                  </label>
                  <select
                    onChange={(e) => handleMappingChange(field, e.target.value)}
                    value={mapping[field] || ""}
                    className="block w-full rounded-lg border-gray-300 py-2.5 pl-3 pr-10 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                  >
                    <option value="" disabled>Selecione uma coluna</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- Ações e Mensagens --- */}
        <section className="border-t border-gray-200 pt-8">
          {message && (
            <div className={`p-4 rounded-lg text-sm font-medium mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading || !file || headers.length === 0}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Processando..." : "Processar e Importar Planilha"}
          </button>
        </section>
      </form>
    </div>
  );
}
