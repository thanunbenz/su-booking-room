import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const sarabun = Sarabun({
  weight: ['300', '400', '500', '600'],
  subsets: ['thai', 'latin'],
  variable: '--font-sarabun',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ระบบจองห้อง - มหาวิทยาลัยศิลปากร",
  description: "ระบบจองห้องภาควิชาคอมพิวเตอร์ มหาวิทยาลัยศิลปากร",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body
        className={`${sarabun.variable} font-sans antialiased`}
        style={{ fontFamily: 'var(--font-sarabun), sans-serif' }}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
