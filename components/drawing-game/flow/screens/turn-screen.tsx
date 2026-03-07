import type { SongLyricLine, TurnAllocation } from "@/components/drawing-game/flow/types";
import { FlowShell, Panel, ProgressBar } from "@/components/drawing-game/flow/ui";
import { cn } from "@/components/drawing-game/flow/utils";

type TurnScreenProps = {
  mode: "preview" | "sing";
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
  const phaseDurationSec = mode === "preview" ? turn.previewSec : turn.durationSec;
  const remainingSec = Math.max(0, remainingMs / 1000);
  const progress = phaseDurationSec <= 0 ? 1 : 1 - remainingSec / phaseDurationSec;
  const firstSnippet = lyrics[0]?.text ?? "Get ready to sing your section";

  return (
    <FlowShell stepLabel={mode === "preview" ? "PREVIEW" : "SING"}>
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
          <p className="text-xs tracking-[0.08em] text-white/45">{mode === "preview" ? "SHORT EXCERPT" : "YOUR SING WINDOW"}</p>
          <p className="font-display text-[1.7rem] leading-none text-white">{remainingSec.toFixed(1)}s</p>
        </div>
        <div className="mt-3">
          <ProgressBar accent={turn.member.accent} progress={progress} />
        </div>
      </Panel>

      {mode === "preview" ? (
        <Panel className="anim-fade-up mt-4 flex-1 border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.08)]">
          <p className="text-xs tracking-[0.08em] text-[#00d4ff]">LISTEN FIRST</p>
          <p className="mt-4 text-[clamp(1.4rem,7vw,1.75rem)] font-semibold leading-tight text-white">{firstSnippet}</p>
          <p className="mt-auto pt-6 text-sm text-white/55">After this preview, sing your full section immediately.</p>
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
