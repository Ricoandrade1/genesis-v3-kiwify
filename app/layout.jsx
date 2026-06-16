import "./globals.css";

export const metadata = {
  title: "Genesis - Plataforma de Produtos Digitais",
  description: "Gerador de infoprodutos vendaveis com IA, copy, funil e checkout Kiwify.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
