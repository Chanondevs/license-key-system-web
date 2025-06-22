import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

const kanit = Kanit({
  subsets: ['latin'], // หรือ 'thai' ก็ได้ถ้ามี
  weight: ['400', '700'], // กำหนดน้ำหนักที่ต้องการ
  variable: '--font-kanit',
})

export const metadata: Metadata = {
  title: "License Key System",
  description: "ระบบจัดการ License Key",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={kanit.variable}>
      <body className="font-kanit">{children}</body>
      <SpeedInsights />
      <Analytics />
    </html>
  );
}
