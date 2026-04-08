import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MOLOKO Studio — Запись на фотосессию и мероприятие",
  description: "Онлайн-запись в фотостудию MOLOKO в Минске. Фотосессии, детские праздники, аренда зала для мероприятий.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
