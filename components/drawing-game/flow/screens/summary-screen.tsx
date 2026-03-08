import type { TurnAllocation } from "@/components/drawing-game/flow/types";
import { FlowShell, Panel, PrimaryButton } from "@/components/drawing-game/flow/ui";

type SummaryScreenProps = {
  turns: TurnAllocation[];
  onContinueToAr: () => void;
  onBackToSetup: () => void;
};

export function SummaryScreen({ turns, onContinueToAr, onBackToSetup }: SummaryScreenProps) {
  return (
    <FlowShell stepLabel="COMPLETE">
      <div className="anim-fade-up">
        <p className="text-xs tracking-[0.08em] text-[#ffd700]">ROUND COMPLETE</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,8.8vw,2.5rem)] leading-none">TEAM FINISHED</h1>
        <p className="mt-2 text-sm leading-6 text-white/60">Good handoff flow. Every member got their preview and full sing section.</p>
      </div>

      <Panel className="anim-fade-up mt-4 flex-1 overflow-y-auto border-[rgba(255,215,0,0.3)] bg-[rgba(255,215,0,0.08)]">
        <p className="text-xs tracking-[0.08em] text-white/45">TURN TIMELINE</p>
        <div className="mt-3 space-y-2">
          {turns.map((turn) => (
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#131313] px-3 py-2" key={turn.member.id}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{turn.member.emoji}</span>
                <p className="text-sm text-white">{turn.member.name}</p>
              </div>
              <p className="text-xs text-white/45">
                {turn.startSec}s - {turn.endSec}s
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="anim-fade-up mt-4 space-y-2">
        <PrimaryButton label="Continue to AR" onClick={onContinueToAr} />
        <button
          className="anim-elevate btn-fit h-10 w-full text-sm font-bold text-white/35 transition-colors hover:text-white/65"
          onClick={onBackToSetup}
          type="button"
        >
          Edit team and settings
        </button>
      </div>
    </FlowShell>
  );
}
