import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "WG Kasa - Öğrenci Evi Bütçe Takibi",
  description: "Öğrenci evi (WG) için yapay zeka destekli alışveriş ve harcama takip uygulaması.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        <Providers>
          <main style={{ minHeight: '100vh', padding: '1rem' }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
