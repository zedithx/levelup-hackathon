import { FlowShell, Panel, PrimaryButton } from "@/components/singing-game/flow/ui";

type ListenScreenProps = {
  trackSrc: string;
  trackTitle: string;
  trackArtist: string;
  hasCompletedListen: boolean;
  onTrackEnded: () => void;
  onReadyToSing: () => void;
};

export function ListenScreen({
  trackSrc,
  trackTitle,
  trackArtist,
  hasCompletedListen,
  onTrackEnded,
  onReadyToSing
}: ListenScreenProps) {
  return (
    <FlowShell stepLabel="LISTEN">
      <div className="anim-fade-up">
        <p className="text-xs tracking-[0.08em] text-[#00d4ff]">LISTEN FIRST</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,8.8vw,2.4rem)] leading-none">HEAR THE TRACK ONCE</h1>
        <p className="mt-2 text-sm leading-6 text-white/60">
          Play the guide track once with the team, then tap ready to start singing turns.
        </p>
      </div>

      <Panel className="anim-fade-up mt-4 border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.08)]">
        <p className="text-xs tracking-[0.07em] text-white/45">GUIDE TRACK</p>
        <p className="mt-1 text-lg font-bold text-white">{trackTitle}</p>
        <p className="text-xs text-white/35">{trackArtist}</p>
        <audio className="mt-4 w-full" controls onEnded={onTrackEnded} preload="metadata" src={trackSrc} />

        {hasCompletedListen ? (
          <p className="mt-3 text-xs text-[#9effd3]">Listen complete. Team can proceed to singing.</p>
        ) : (
          <p className="mt-3 text-xs text-[#ffd9b8]">Finish one full play before continuing.</p>
        )}
      </Panel>

      <Panel className="anim-fade-up mt-4 border-[rgba(255,51,153,0.25)] bg-[rgba(255,51,153,0.08)]">
        <p className="text-sm text-white/65">When singing starts, each member has 8 seconds. Pass cue appears in the last 3 seconds.</p>
      </Panel>

      <div className="anim-fade-up mt-4">
        <PrimaryButton disabled={!hasCompletedListen} label="Ready To Sing" onClick={onReadyToSing} />
      </div>
    </FlowShell>
  );
}
