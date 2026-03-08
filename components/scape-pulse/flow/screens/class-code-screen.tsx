/* eslint-disable @next/next/no-img-element */

import type { MutableRefObject } from "react";

import { ASSETS } from "@/components/scape-pulse/flow/constants";
import { BrandBar, PrimaryButton, ProgressDots } from "@/components/scape-pulse/flow/ui";
import { cn, reveal } from "@/components/scape-pulse/flow/utils";

type ClassCodeScreenProps = {
  codeChars: string[];
  onCodeCharChange: (index: number, value: string) => void;
  onCodePaste: (index: number, value: string) => void;
  onCodeBackspace: (index: number) => void;
  codeRefs: MutableRefObject<Array<HTMLInputElement | null>>;
  onJoin: () => void;
  onBackToIntro: () => void;
  canJoin: boolean;
};

export function ClassCodeScreen({
  codeChars,
  onCodeCharChange,
  onCodePaste,
  onCodeBackspace,
  codeRefs,
  onJoin,
  onBackToIntro,
  canJoin
}: ClassCodeScreenProps) {
  return (
    <div className="anim-screen-in flex min-h-[100dvh] flex-col md:min-h-[852px]">
      <BrandBar />
      <ProgressDots step={5} />

      <div className="flex flex-1 flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-2">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div
            className="anim-fade-up relative mb-9 flex size-20 items-center justify-center rounded-2xl border border-[rgba(255,107,0,0.2)] bg-[rgba(255,107,0,0.1)]"
            style={reveal(60)}
          >
            <img alt="" className="anim-float size-10" src={ASSETS.classCodeIcon} />
          </div>

          <h1
            className="anim-fade-up mb-4 text-center font-display text-[clamp(1.9rem,8.6vw,2.2rem)] leading-none tracking-[0.03em] text-white"
            style={reveal(140)}
          >
            ENTER YOUR CLASS CODE
          </h1>
          <p
            className="anim-fade-up mb-8 max-w-[320px] text-center text-[clamp(0.9rem,3.6vw,1rem)] leading-[1.4] text-white/40"
            style={reveal(200)}
          >
            Your teacher or facilitator will give you a 6-character code. Ask them if you
            do not have one!
          </p>

          <fieldset
            className="anim-fade-up mb-4 flex w-full justify-center gap-[clamp(0.35rem,1.8vw,0.625rem)]"
            style={reveal(260)}
          >
            <legend className="sr-only">Class code input</legend>
            {codeChars.map((character, index) => (
              <input
                aria-label={`Code character ${index + 1}`}
                className={cn(
                  "h-[clamp(2.9rem,7vh,3.5rem)] w-[clamp(2.2rem,11vw,3rem)] rounded-[14px] border text-center text-lg uppercase transition-colors",
                  "bg-[#1a1a1a] text-white focus:border-[#ff6b00] focus:outline-none",
                  character ? "border-[#ff6b00]/45" : "border-white/10"
                )}
                inputMode="text"
                key={index}
                maxLength={1}
                onChange={(event) => onCodeCharChange(index, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && !character) {
                    onCodeBackspace(index);
                  }
                }}
                onPaste={(event) => {
                  event.preventDefault();
                  onCodePaste(index, event.clipboardData.getData("text"));
                }}
                ref={(node) => {
                  codeRefs.current[index] = node;
                }}
                value={character}
              />
            ))}
          </fieldset>

          <p className="anim-fade-up text-center text-xs text-white/20" style={reveal(300)}>
            Demo code: PULSE1
          </p>
        </div>

        <div className="anim-fade-up space-y-2" style={reveal(350)}>
          <PrimaryButton disabled={!canJoin} label="Join Game" onClick={onJoin} />
          <button
            className="anim-elevate btn-fit h-11 w-full text-sm font-bold text-white/20 transition-colors hover:text-white/45"
            onClick={onBackToIntro}
            type="button"
          >
            Back to intro
          </button>
        </div>
      </div>
    </div>
  );
}
