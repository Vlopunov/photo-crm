import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUMOS Studio — Запись на фотосессию",
  description: "Онлайн-запись в фотостудию LUMOS. Выберите удобное время и забронируйте фотосессию.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
