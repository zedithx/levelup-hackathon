/* eslint-disable @next/next/no-img-element */

import { ASSETS } from "@/components/scape-pulse/flow/constants";
import { BrandBar } from "@/components/scape-pulse/flow/ui";
import { reveal } from "@/components/scape-pulse/flow/utils";

type HandoffScreenProps = {
  gamemasterName: string;
  gamemasterAvatar: string;
  onPassPhone: () => void;
};

export function HandoffScreen({ gamemasterName, gamemasterAvatar, onPassPhone }: HandoffScreenProps) {
  return (
    <div className="anim-screen-in flex min-h-[100dvh] flex-col md:min-h-[852px]">
      <BrandBar />

      <div className="flex flex-1 flex-col items-center px-5 pb-8 pt-5">
        <div
          className="anim-fade-up relative mb-7 mt-[clamp(2rem,10vh,5rem)] flex size-28 items-center justify-center rounded-3xl border-2 border-[#ffd700] bg-[rgba(255,215,0,0.08)] shadow-[0_0_40px_rgba(255,215,0,0.14)]"
          style={reveal(70)}
        >
          <span className="anim-float text-5xl">{gamemasterAvatar}</span>
          <span className="anim-glow absolute -right-3 -top-3 flex size-10 items-center justify-center rounded-full bg-[#ffd700] shadow-[0_0_20px_rgba(255,215,0,0.32)]">
            <img alt="" className="size-5" src={ASSETS.crownIcon} />
          </span>
        </div>

        <p className="anim-fade-up mb-2 text-xs tracking-[0.3em] text-[#ffd700]" style={reveal(130)}>
          YOU&apos;RE THE GAMEMASTER
        </p>
        <p
          className="anim-fade-up mb-4 font-display text-[clamp(2.1rem,9.5vw,2.6rem)] leading-none text-[#ffd700]"
          style={reveal(180)}
        >
          {gamemasterName.toUpperCase()}
        </p>
        <p
          className="anim-fade-up mb-6 max-w-[320px] text-center text-[clamp(0.9rem,3.6vw,1rem)] leading-[1.55] text-white/50"
          style={reveal(230)}
        >
          Lead your squad to victory! Add your teammates, name your team, and start the adventure.
        </p>

        <button
          className="anim-fade-up mb-8 inline-flex h-[38px] items-center gap-2 rounded-full border border-[rgba(255,107,0,0.32)] bg-[rgba(255,107,0,0.1)] px-5 text-[clamp(0.85rem,3.4vw,0.95rem)] leading-5 text-[#ff6b00] transition-colors hover:bg-[rgba(255,107,0,0.18)]"
          onClick={onPassPhone}
          style={reveal(300)}
          type="button"
        >
          <img alt="" className="size-4" src={ASSETS.swordsIcon} />
          <span>Pass the phone to add your squad</span>
        </button>

        <p className="anim-fade-up mb-3 text-xs text-white/20" style={reveal(350)}>
          Loading your lobby...
        </p>
        <span className="anim-fade-up block" style={reveal(390)}>
          <span className="anim-soft-spin block h-8 w-5 rounded-full border border-white/10 border-t-white/35" />
        </span>
      </div>
    </div>
  );
}
