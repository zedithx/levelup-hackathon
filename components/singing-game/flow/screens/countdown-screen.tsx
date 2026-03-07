import { FlowShell, Panel } from "@/components/singing-game/flow/ui";

type CountdownScreenProps = {
  countdown: number;
};

export function CountdownScreen({ countdown }: CountdownScreenProps) {
  return (
    <FlowShell stepLabel="COUNTDOWN">
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="anim-fade-up text-xs tracking-[0.08em] text-white/35">GET READY</p>
        <h1 className="anim-fade-up mt-2 text-center font-display text-[clamp(2rem,8.8vw,2.5rem)] leading-none">
          ROUND STARTING
        </h1>

        <Panel className="anim-pop-in mt-8 flex h-48 w-48 items-center justify-center rounded-full border-[rgba(255,107,0,0.45)] bg-[radial-gradient(circle,rgba(255,107,0,0.35)_0%,rgba(255,107,0,0.08)_72%)]">
          <span className="font-display text-[clamp(5rem,22vw,6rem)] leading-none text-white">{Math.max(countdown, 0)}</span>
        </Panel>

        <p className="mt-8 text-sm text-white/45">Listen for the cue, then pass smoothly to each singer.</p>
      </div>
    </FlowShell>
  );
}
