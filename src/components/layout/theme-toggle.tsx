"use client";

import { MoonStar, SunMedium } from "lucide-react";

import { cn } from "@/lib/utils";

const STORAGE_KEY = "br-theme";

type ThemeMode = "dark" | "light";

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeToggle() {
  const handleToggle = () => {
    const currentTheme: ThemeMode =
      document.documentElement.dataset.theme === "light" ? "light" : "dark";
    const nextTheme: ThemeMode = currentTheme === "light" ? "dark" : "light";
    applyTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label="切换主题"
      title="切换主题"
      className={cn(
        "theme-toggle inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
        "border-[var(--shell-border)] bg-[var(--shell-control-bg)] text-[var(--shell-control-fg)]",
        "shadow-[var(--shell-control-shadow)] hover:bg-[var(--shell-control-bg-hover)]",
      )}
    >
      <SunMedium className="theme-toggle-sun h-4 w-4" />
      <MoonStar className="theme-toggle-moon hidden h-4 w-4" />
    </button>
  );
}
