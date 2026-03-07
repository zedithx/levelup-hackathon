import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/components/singing-game/flow/utils";

type FlowShellProps = {
  children: ReactNode;
  stepLabel: string;
};

export function FlowShell({ children, stepLabel }: FlowShellProps) {
  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,rgba(255,107,0,0.14),transparent_38%),#050505] md:px-6 md:py-8">
      <main className="mx-auto min-h-[100dvh] w-full max-w-[393px] overflow-hidden border border-white/10 bg-[#0a0a0a] text-white md:min-h-[852px] md:rounded-[24px]">
        <header className="flex h-14 items-center justify-between px-5">
          <p className="font-display text-[clamp(1rem,4.5vw,1.125rem)] leading-7 tracking-[0.045em]">
            <span className="text-[#ff6b00]">*SCAPE</span>
            <span className="text-white/20"> | </span>
            <span className="text-white/85">PULSE</span>
          </p>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] font-bold tracking-[0.08em] text-white/60">
            {stepLabel}
          </span>
        </header>

        <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <section className="flex min-h-[calc(100dvh-57px)] flex-col px-5 pb-5 pt-4 md:min-h-[795px]">{children}</section>
      </main>
    </div>
  );
}

type PanelProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function Panel({ children, className, style }: PanelProps) {
  return (
    <div className={cn("rounded-[16px] border border-white/10 bg-[#171717] p-4", className)} style={style}>
      {children}
    </div>
  );
}

type PrimaryButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
};

export function PrimaryButton({ label, onClick, disabled, className }: PrimaryButtonProps) {
  return (
    <button
      className={cn(
        "h-[58px] w-full rounded-2xl font-display text-[clamp(1rem,4.4vw,1.12rem)] tracking-[0.045em] transition-colors",
        disabled ? "bg-[rgba(255,107,0,0.24)] text-white/30" : "bg-[#ff6b00] text-white hover:bg-[#ff7e24]",
        className
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label.toUpperCase()}
    </button>
  );
}

type GhostButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
};

export function GhostButton({ label, onClick, disabled, className }: GhostButtonProps) {
  return (
    <button
      className={cn(
        "h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-bold transition-colors",
        disabled ? "text-white/20" : "text-white/70 hover:border-[#ff6b00]/40 hover:text-white",
        className
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

type ProgressBarProps = {
  progress: number;
  accent?: string;
};

export function ProgressBar({ progress, accent = "#ff6b00" }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(progress, 1));

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full transition-[width] duration-100"
        style={{
          width: `${clampedProgress * 100}%`,
          backgroundColor: accent
        }}
      />
    </div>
  );
}
