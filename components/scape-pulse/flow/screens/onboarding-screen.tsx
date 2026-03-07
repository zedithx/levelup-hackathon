/* eslint-disable @next/next/no-img-element */

import type { OnboardingSlide } from "@/components/scape-pulse/flow/types";
import { BrandBar, PrimaryButton, ProgressDots } from "@/components/scape-pulse/flow/ui";
import { reveal } from "@/components/scape-pulse/flow/utils";

type OnboardingScreenProps = {
  slide: OnboardingSlide;
  onNext: () => void;
  onSkip: () => void;
};

export function OnboardingScreen({ slide, onNext, onSkip }: OnboardingScreenProps) {
  return (
    <div className="anim-screen-in flex min-h-[100dvh] flex-col md:min-h-[852px]">
      <BrandBar onSkip={onSkip} showSkip />
      <ProgressDots step={slide.progressStep} />

      <div className="flex flex-1 flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-2">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div
            className="anim-fade-up relative mb-7 flex size-[min(28vw,7rem)] items-center justify-center rounded-3xl border"
            style={{
              ...reveal(60),
              backgroundColor: slide.accent.tileBackground,
              borderColor: slide.accent.tileBorder
            }}
          >
            <img alt="" className="anim-float size-14" src={slide.icon} />
            <span
              className="absolute -right-2 -top-2 size-4 rounded-full"
              style={{ backgroundColor: slide.accent.orb }}
            />
            <span
              className="absolute -bottom-1.5 -left-1.5 size-3 rounded-full"
              style={{ backgroundColor: slide.accent.tileBorder }}
            />
          </div>

          <p
            className="anim-fade-up mb-4 text-center text-xs font-normal tracking-[0.3em]"
            style={{ ...reveal(110), color: slide.accent.color }}
          >
            {slide.stepLabel}
          </p>
          <h1
            className="anim-fade-up mb-4 text-center font-display text-[clamp(2rem,9vw,2.3rem)] leading-none tracking-[0.03em] text-white"
            style={reveal(170)}
          >
            {slide.title}
          </h1>
          <p
            className="anim-fade-up mb-5 text-center text-[clamp(0.92rem,3.7vw,1rem)] font-normal leading-5 text-white/60"
            style={reveal(220)}
          >
            {slide.subtitle}
          </p>
          <p
            className="anim-fade-up max-w-[320px] text-center text-[clamp(0.9rem,3.6vw,1rem)] leading-[1.62] text-white/40"
            style={reveal(270)}
          >
            {slide.description}
          </p>
        </div>

        <div className="anim-fade-up" style={reveal(330)}>
          <PrimaryButton label={slide.ctaLabel} onClick={onNext} />
        </div>
      </div>
    </div>
  );
}
