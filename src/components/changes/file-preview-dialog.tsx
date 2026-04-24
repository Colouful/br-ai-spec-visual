"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      content: string;
      sourcePath: string;
      size: number;
      updatedAt: string;
    };

export function FilePreviewButton({
  changeId,
  filePath,
  label = "预览文件",
}: {
  changeId: string;
  filePath: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<PreviewState>({ status: "idle" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/changes/${encodeURIComponent(changeId)}/preview`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: data?.error || `请求失败（${res.status}）` });
        return;
      }
      setState({
        status: "ready",
        content: data.content ?? "",
        sourcePath: data.sourcePath ?? filePath,
        size: data.size ?? 0,
        updatedAt: data.updatedAt ?? "",
      });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "网络异常",
      });
    }
  }, [changeId, filePath]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          if (state.status === "idle") {
            void load();
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-50 transition hover:border-cyan-200/50 hover:bg-cyan-300/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
      >
        <EyeIcon />
        {label}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              className="glass-panel-strong relative flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border border-white/10 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
              <header className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
                    文件预览
                  </p>
                  <h3 className="mt-1 truncate text-base font-semibold text-white">
                    {state.status === "ready" ? state.sourcePath : filePath}
                  </h3>
                  {state.status === "ready" ? (
                    <p className="mt-1 font-mono text-[11px] text-slate-500">
                      {formatSize(state.size)} · 修改于{" "}
                      {state.updatedAt ? new Date(state.updatedAt).toLocaleString("zh-CN") : "未知"}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {state.status === "ready" ? (
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(state.content);
                      }}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-200 transition hover:border-white/25 hover:bg-white/8"
                    >
                      复制内容
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-200 transition hover:border-white/25 hover:bg-white/8"
                    aria-label="关闭"
                  >
                    关闭
                  </button>
                </div>
              </header>

              <div className="relative flex-1 overflow-auto px-5 py-5 sm:px-6">
                {state.status === "loading" ? (
                  <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                    <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-300/80" />
                    正在加载文件内容…
                  </div>
                ) : null}
                {state.status === "error" ? (
                  <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    加载失败：{state.message}
                  </div>
                ) : null}
                {state.status === "ready" ? (
                  <pre className="whitespace-pre-wrap break-words rounded-2xl border border-white/8 bg-black/30 p-4 font-mono text-[12.5px] leading-6 text-slate-100">
                    {state.content || "（文件为空）"}
                  </pre>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path d="M2 10s2.8-5 8-5 8 5 8 5-2.8 5-8 5-8-5-8-5Z" />
      <circle cx="10" cy="10" r="2.2" />
    </svg>
  );
}
