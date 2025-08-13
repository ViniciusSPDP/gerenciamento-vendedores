import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// --- METADADOS OTIMIZADOS ---
export const metadata: Metadata = {
  // Título e Descrição Principal (importante para SEO)
  title: "Sistema de Gestão de Vendas | Conexão Distribuidora",
  description: "Plataforma para gerenciamento de atendimentos e análise de performance de vendedores.",
  
  // Palavras-chave relevantes para o seu negócio
  keywords: ["gestão de vendas", "dashboard de vendedor", "CRM", "análise de clientes", "leads"],

  // Informações do Autor ou Empresa
  authors: [{ name: "Vinicius Saraiva", url: "https://s4r41va.com" }],
  creator: "Vinicius Saraiva",

  // --- Open Graph (para compartilhamento em redes sociais como Facebook, LinkedIn, WhatsApp) ---
  openGraph: {
    title: "Sistema de Gestão de Vendas",
    description: "Análise de performance e gerenciamento de atendimentos de forma eficiente.",
    url: "https://conexaodistribuidora.com.br", // URL principal do seu site
    siteName: "Gestão de Vendas Pro",
    // Imagem que aparecerá quando o link for compartilhado. MUITO IMPORTANTE!
    // Crie uma imagem de 1200x630px e coloque na pasta /public. Depois, atualize o caminho.
    images: [
      {
        url: "/og-image.png", // Ex: https://seusite.com/og-image.png
        width: 1200,
        height: 630,
        alt: "Dashboard do Sistema de Gestão de Vendas",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },

  // --- Outros Metadados Relevantes ---
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Ícones (Favicon)
  // Coloque seus arquivos de favicon na pasta /app
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // --- Idioma alterado para Português do Brasil ---
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
