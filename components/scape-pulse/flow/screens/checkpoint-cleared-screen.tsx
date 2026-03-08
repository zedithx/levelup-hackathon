import { BrandBar, PrimaryButton } from "@/components/scape-pulse/flow/ui";
import { reveal } from "@/components/scape-pulse/flow/utils";

type CheckpointClearedScreenProps = {
  mascotName: string;
  checkpointName: string;
  onViewFinalDestination: () => void;
  onBackToLobby: () => void;
};

export function CheckpointClearedScreen({
  mascotName,
  checkpointName,
  onViewFinalDestination,
  onBackToLobby
}: CheckpointClearedScreenProps) {
  return (
    <div className="anim-screen-in flex min-h-[100dvh] flex-col md:min-h-[852px]">
      <BrandBar />

      <div className="flex flex-1 flex-col items-center justify-center px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-2 text-center">
        <div className="anim-fade-up mb-5 flex size-20 items-center justify-center rounded-full border border-[#00d4ff]/45 bg-[rgba(0,212,255,0.12)] text-3xl">
          🎯
        </div>
        <p className="anim-fade-up text-xs tracking-[0.2em] text-[#00d4ff]" style={reveal(80)}>
          CHECKPOINT MATCHED
        </p>
        <h1 className="anim-fade-up mt-3 font-display text-[clamp(2rem,8.7vw,2.3rem)] leading-none text-white" style={reveal(120)}>
          {checkpointName.toUpperCase()} CLEAR
        </h1>
        <p className="anim-fade-up mt-4 max-w-[290px] text-sm leading-6 text-white/55" style={reveal(160)}>
          {mascotName} confirms the match. If this is your final destination, launch the ending memory carousel.
        </p>

        <div className="anim-fade-up mt-8 w-full" style={reveal(220)}>
          <PrimaryButton label="View Ending Carousel" onClick={onViewFinalDestination} />
        </div>
        <button
          className="anim-elevate btn-fit anim-fade-up mt-3 h-11 w-full text-sm font-bold text-white/25 transition-colors hover:text-white/55"
          onClick={onBackToLobby}
          style={reveal(260)}
          type="button"
        >
          Back to lobby
        </button>
      </div>
    </div>
  );
}
