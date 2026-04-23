import type { Metadata } from "next";

import { AuroraBackground } from "@/components/ui/aurora-background";

import "./globals.css";

const themeInitScript = `
  (() => {
    try {
      const storedTheme = window.localStorage.getItem("br-theme");
      const theme = storedTheme === "light" ? "light" : "dark";
      document.documentElement.dataset.theme = theme;
    } catch {
      document.documentElement.dataset.theme = "dark";
    }
  })();
`;

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
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
          suppressHydrationWarning
        />
      </head>
      <body
        className="relative min-h-full flex flex-col text-[var(--foreground)]"
        suppressHydrationWarning
      >
        <AuroraBackground />
        {children}
      </body>
    </html>
  );
}
