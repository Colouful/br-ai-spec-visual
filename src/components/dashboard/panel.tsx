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
        "glass-panel relative overflow-hidden rounded-[24px] p-5 sm:p-6",
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
              <h2 className="text-lg font-semibold tracking-tight text-white">
                {title}
              </h2>
            ) : null}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
