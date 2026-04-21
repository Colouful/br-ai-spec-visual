"use client";

import { useEffect, useRef } from "react";

export function AuroraBackground() {
  const spotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = spotRef.current;
    if (!el) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.transform = `translate3d(${cx - 300}px, ${cy - 300}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="aurora-bg" aria-hidden="true">
      <div
        className="aurora-blob animate-blob"
        style={{
          top: "-12%",
          left: "-8%",
          width: "520px",
          height: "520px",
          background: "radial-gradient(circle, rgba(34,211,238,0.55), transparent 60%)",
        }}
      />
      <div
        className="aurora-blob animate-blob"
        style={{
          top: "30%",
          right: "-10%",
          width: "560px",
          height: "560px",
          background: "radial-gradient(circle, rgba(168,85,247,0.45), transparent 60%)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="aurora-blob animate-blob"
        style={{
          bottom: "-18%",
          left: "30%",
          width: "640px",
          height: "640px",
          background: "radial-gradient(circle, rgba(99,102,241,0.42), transparent 60%)",
          animationDelay: "-12s",
        }}
      />
      <div className="aurora-grid" />
      <div className="aurora-noise" />
      <div
        ref={spotRef}
        className="pointer-events-none absolute"
        style={{
          width: "600px",
          height: "600px",
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, rgba(34,211,238,0.10), transparent 60%)",
          willChange: "transform",
        }}
      />
    </div>
  );
}
