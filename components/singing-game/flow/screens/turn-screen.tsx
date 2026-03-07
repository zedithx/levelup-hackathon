import type { SongLyricLine, TurnAllocation } from "@/components/singing-game/flow/types";
import { FlowShell, Panel, ProgressBar } from "@/components/singing-game/flow/ui";
import { cn } from "@/components/singing-game/flow/utils";

type TurnScreenProps = {
  mode: "ready" | "sing";
  turn: TurnAllocation;
  remainingMs: number;
  lyrics: SongLyricLine[];
  activeLyricLineIndex: number;
  nextMemberName: string | null;
};

export function TurnScreen({
  mode,
  turn,
  remainingMs,
  lyrics,
  activeLyricLineIndex,
  nextMemberName
}: TurnScreenProps) {
  const phaseDurationSec = mode === "ready" ? turn.readySec : turn.durationSec;
  const remainingSec = Math.max(0, remainingMs / 1000);
  const progress = phaseDurationSec <= 0 ? 1 : 1 - remainingSec / phaseDurationSec;

  return (
    <FlowShell stepLabel={mode === "ready" ? "READY" : "SING"}>
      <div className="anim-fade-up flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.08em] text-white/35">CURRENT SINGER</p>
          <p className="mt-1 text-sm text-white/60">Turn {turn.memberIndex + 1}</p>
        </div>
        <div className="flex items-center gap-2 rounded-[12px] border border-white/10 bg-white/5 px-3 py-2">
          <span className="text-2xl">{turn.member.emoji}</span>
          <p className="font-display text-[1.12rem] tracking-[0.03em] text-white">{turn.member.name}</p>
        </div>
      </div>

      <Panel className="anim-fade-up mt-4 border-[rgba(255,107,0,0.3)] bg-[rgba(255,107,0,0.08)]">
        <div className="flex items-center justify-between">
          <p className="text-xs tracking-[0.08em] text-white/45">{mode === "ready" ? "GET READY" : "YOUR SING WINDOW"}</p>
          <p className="font-display text-[1.7rem] leading-none text-white">{remainingSec.toFixed(1)}s</p>
        </div>
        <div className="mt-3">
          <ProgressBar accent={turn.member.accent} progress={progress} />
        </div>
      </Panel>

      {mode === "ready" ? (
        <Panel className="anim-fade-up mt-4 flex-1 border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.08)]">
          <p className="text-xs tracking-[0.08em] text-[#00d4ff]">READY PHASE</p>
          <p className="mt-4 font-display text-[clamp(2rem,9vw,2.6rem)] leading-none text-white">
            GET READY
          </p>
          <p className="mt-2 text-[clamp(1.2rem,5.5vw,1.5rem)] font-semibold text-white/90">
            {turn.member.emoji} {turn.member.name}
          </p>
          <p className="mt-auto pt-6 text-sm text-white/55">Singing starts immediately when the timer reaches zero.</p>
        </Panel>
      ) : (
        <Panel className="anim-fade-up mt-4 flex-1 border-[rgba(255,51,153,0.3)] bg-[rgba(255,51,153,0.08)]">
          <p className="text-xs tracking-[0.08em] text-[#ff3399]">LYRICS</p>
          <div className="mt-4 space-y-3">
            {lyrics.map((line, index) => {
              const isActive = index === activeLyricLineIndex;

              return (
                <p
                  className={cn(
                    "rounded-xl px-3 py-2 text-[clamp(1.08rem,5vw,1.35rem)] leading-snug transition-all",
                    isActive ? "bg-white/10 text-white" : "text-white/45"
                  )}
                  key={line.id}
                >
                  {line.text}
                </p>
              );
            })}
          </div>
        </Panel>
      )}

      <p className="anim-fade-up mt-4 text-center text-sm text-white/45">
        {nextMemberName ? `Next up: ${nextMemberName}` : "Final singer. Finish strong."}
      </p>
    </FlowShell>
  );
}
