"use client";

import React from "react";
import type { LifeAreaId } from "@/lib/types";

export const AREA_TINT: Record<LifeAreaId, string> = {
  career: "#8b5cf6", learning: "#3b82f6", health: "#22c55e",
  finance: "#f59e0b", relationships: "#ec4899", mind: "#06b6d4",
  home: "#f97316", purpose: "#a78bfa", hobbies: "#34d399"
};

export function Card({ children, className = "", style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <section
      className={`rounded-2xl border border-line bg-card/90 shadow-card backdrop-blur-sm ${className}`}
      style={style}
    >
      {children}
    </section>
  );
}

export function CardHead({ title, action, onAction, icon }: {
  title: string; action?: string; onAction?: () => void; icon?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between px-5 pt-4 pb-3">
      <h2 className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-ink">
        {icon}{title}
      </h2>
      {action && (
        <button onClick={onAction} className="text-[11px] font-medium text-mute transition hover:text-ink">
          {action} ›
        </button>
      )}
    </header>
  );
}

export function Chip({ label, tint }: { label: string; tint: string }) {
  return (
    <span
      className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ color: tint, background: `${tint}1f`, border: `1px solid ${tint}40` }}
    >
      {label}
    </span>
  );
}

/** Circular progress ring (Momentum Score, habits, widgets). */
export function Ring({ value, size = 120, stroke = 9, tint, track = "#1b2340", children, gradient }: {
  value: number; size?: number; stroke?: number; tint?: string; track?: string;
  children?: React.ReactNode; gradient?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  const gid = React.useId();
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {gradient && (
          <defs>
            <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="55%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        )}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={gradient ? `url(#${gid})` : tint ?? "#6366f1"}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset .8s cubic-bezier(.2,.7,.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/** Area sparkline for the Momentum Score history. */
export function Sparkline({ points, height = 90 }: { points: number[]; height?: number }) {
  const gid = React.useId();
  const w = 100, h = 100;
  const min = Math.min(...points), max = Math.max(...points);
  const span = Math.max(1, max - min);
  const step = w / (points.length - 1);
  const xy = points.map((p, i) => [i * step, h - ((p - min) / span) * (h - 18) - 6]);
  const line = xy.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const fill = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke="#8b8cf8" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      {xy.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.6" fill="#c4b5fd" />
      ))}
    </svg>
  );
}

export function ProgressBar({ value, tint = "#6366f1", className = "" }: {
  value: number; tint?: string; className?: string;
}) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-line ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, value)}%`, background: `linear-gradient(90deg, ${tint}, ${tint}cc)` }}
      />
    </div>
  );
}

export function GradientButton({ children, onClick, className = "" }: {
  children: React.ReactNode; onClick?: () => void; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl bg-gradient-to-r from-indigo to-violet px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 active:scale-[.98] ${className}`}
    >
      {children}
    </button>
  );
}

export function Check({ checked }: { checked: boolean }) {
  return (
    <span
      className={`grid h-[18px] w-[18px] place-items-center rounded-[5px] border text-[11px] transition ${
        checked ? "border-mint bg-mint text-bg" : "border-line bg-raise text-transparent"
      }`}
    >
      ✓
    </span>
  );
}
