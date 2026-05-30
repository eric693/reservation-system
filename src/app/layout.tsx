import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "美甲預約系統",
  description: "專業美甲預約管理系統",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
