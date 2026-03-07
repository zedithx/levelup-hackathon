import type { TurnAllocation } from "@/components/singing-game/flow/types";
import { FlowShell, Panel, PrimaryButton } from "@/components/singing-game/flow/ui";

type OrderScreenProps = {
  turns: TurnAllocation[];
  onStartNow: () => void;
};

export function OrderScreen({ turns, onStartNow }: OrderScreenProps) {
  return (
    <FlowShell stepLabel="ORDER">
      <div className="anim-fade-up">
        <p className="text-xs tracking-[0.08em] text-[#00d4ff]">PASS ORDER</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,8.8vw,2.4rem)] leading-none">WHO SINGS WHEN</h1>
        <p className="mt-2 text-sm leading-6 text-white/55">
          The phone follows this order. Every turn is 3s get ready, then 8s sing.
        </p>
      </div>

      <div className="anim-fade-up mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
        {turns.map((turn, index) => (
          <Panel className="flex items-center gap-3 p-3" key={turn.member.id}>
            <span className="flex h-8 min-w-8 items-center justify-center rounded-[9px] bg-white/8 text-xs font-bold text-white/60">
              {index + 1}
            </span>
            <span className="flex size-10 items-center justify-center rounded-[10px] bg-white/5 text-2xl">
              {turn.member.emoji}
            </span>
            <div className="flex-1">
              <p className="text-base font-semibold text-white">{turn.member.name}</p>
              <p className="text-xs text-white/35">
                {turn.startSec}s - {turn.endSec}s ({turn.readySec}s ready + {turn.durationSec}s sing)
              </p>
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="anim-fade-up mt-4 border-[rgba(255,51,153,0.25)] bg-[rgba(255,51,153,0.08)]">
        <p className="text-sm text-white/65">Auto-starting shortly. You can begin immediately if the team is ready.</p>
      </Panel>

      <div className="anim-fade-up mt-4">
        <PrimaryButton label="Start First Singer" onClick={onStartNow} />
      </div>
    </FlowShell>
  );
}
