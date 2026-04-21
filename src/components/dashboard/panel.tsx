import clsx from "clsx";
import type { ReactNode } from "react";

export function Panel({
  title,
  eyebrow,
  aside,
  children,
  className,
}: {
  title?: string;
  eyebrow?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,17,28,0.95),rgba(6,11,19,0.92))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.36)] backdrop-blur",
        className,
      )}
    >
      {(title || eyebrow || aside) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            {eyebrow ? (
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
            ) : null}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
