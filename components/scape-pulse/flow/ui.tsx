/* eslint-disable @next/next/no-img-element */

import { ASSETS } from "@/components/scape-pulse/flow/constants";
import { cn } from "@/components/scape-pulse/flow/utils";

type BrandBarProps = {
  showSkip?: boolean;
  onSkip?: () => void;
  showPhoneIndicator?: boolean;
};

export function BrandBar({ showSkip, onSkip, showPhoneIndicator }: BrandBarProps) {
  return (
    <header className="flex h-14 items-center justify-between px-5">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-[10px] bg-[#ff6b00]">
          <img alt="" className="size-4" src={ASSETS.logoZap} />
        </div>
        <p className="font-display text-[clamp(1rem,4.5vw,1.125rem)] leading-7 tracking-[0.045em]">
          <span className="text-[#ff6b00]">*SCAPE</span>
          <span className="text-white/85"> </span>
          <span className="text-white/20">|</span>
          <span className="text-white/85"> PULSE</span>
        </p>
      </div>

      {showSkip ? (
        <button
          className="anim-elevate text-sm font-bold text-white/30 transition-colors hover:text-white/60"
          onClick={onSkip}
          type="button"
        >
          Skip
        </button>
      ) : null}

      {showPhoneIndicator ? (
        <p className="flex items-center gap-1.5 text-xs text-white/30">
          <img alt="" className="size-3" src={ASSETS.phoneIcon} />
          <span>1 phone</span>
        </p>
      ) : null}
    </header>
  );
}

type ProgressDotsProps = {
  step: 1 | 2 | 3 | 4 | 5;
};

export function ProgressDots({ step }: ProgressDotsProps) {
  return (
    <div className="flex h-7 items-center justify-center gap-2">
      {Array.from({ length: 5 }).map((_, index) => {
        const marker = index + 1;
        const isCurrent = marker === step;
        const isComplete = marker < step;
        const widthClass = isCurrent ? "w-6" : isComplete ? "w-4" : "w-2";

        return (
          <span
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              widthClass,
              isCurrent || isComplete ? "bg-[#ff6b00]" : "bg-white/10"
            )}
            key={marker}
          />
        );
      })}
    </div>
  );
}

type PrimaryButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
};

export function PrimaryButton({
  label,
  onClick,
  disabled,
  fullWidth = true,
  ariaLabel
}: PrimaryButtonProps) {
  return (
    <button
      aria-label={ariaLabel ?? label}
      className={cn(
        "anim-elevate btn-fit inline-flex h-[clamp(3.25rem,8vh,3.75rem)] items-center justify-center gap-2 rounded-2xl px-5 text-[clamp(1rem,4.5vw,1.125rem)] leading-7 tracking-[0.045em] transition-all duration-200 motion-safe:active:scale-[0.99]",
        "font-display",
        fullWidth ? "w-full" : "w-auto",
        disabled
          ? "bg-[rgba(255,107,0,0.3)] text-white/40"
          : "bg-[#ff6b00] text-white hover:bg-[#ff7e24]"
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span>{label.toUpperCase()}</span>
      <img alt="" className={cn("size-4", disabled ? "opacity-30" : "opacity-100")} src={ASSETS.arrowRight} />
    </button>
  );
}
