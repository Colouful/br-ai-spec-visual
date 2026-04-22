import Link from "next/link";

interface WorkspacePlaceholderProps {
  title: string;
  eyebrow: string;
  description: string;
  legacyHref?: string;
  upcoming?: string[];
}

export function WorkspacePlaceholder({
  title,
  eyebrow,
  description,
  legacyHref,
  upcoming,
}: WorkspacePlaceholderProps) {
  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-400">{description}</p>
      </header>

      <div className="glass-panel rounded-2xl p-6">
        <p className="text-sm font-medium text-slate-200">即将推出</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          {(upcoming ?? [
            "在工作区上下文中聚焦展示属于本项目的产物与流程",
            "与全局视图保持数据一致，但去除跨工作区噪音",
            "结合五阶段流水线主视图深度联动",
          ]).map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300/80" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {legacyHref ? (
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/8 pt-5 text-xs text-slate-400">
            <span className="font-mono uppercase tracking-[0.28em] text-slate-500">
              过渡视图
            </span>
            <Link
              href={legacyHref}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-slate-200 transition hover:border-white/20 hover:text-white"
            >
              使用旧的全局视图 →
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
