import type { Metadata } from "next";

import { AuroraBackground } from "@/components/ui/aurora-background";

import "./globals.css";

export const metadata: Metadata = {
  description: "BR AI Spec 可视化控制台认证壳层与基础导航。",
  title: {
    default: "BR AI Spec 控制台",
    template: "%s | BR AI Spec 控制台",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="h-full antialiased" lang="zh-CN" suppressHydrationWarning>
      <body
        className="relative min-h-full text-slate-100 flex flex-col"
        suppressHydrationWarning
      >
        <AuroraBackground />
        {children}
      </body>
    </html>
  );
}
