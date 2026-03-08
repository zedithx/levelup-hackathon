import type { TurnAllocation } from "@/components/singing-game/flow/types";
import { FlowShell, Panel, PrimaryButton } from "@/components/singing-game/flow/ui";

type SummaryScreenProps = {
  turns: TurnAllocation[];
  audioPreviewUrl: string | null;
  isAudioUploading: boolean;
  isAudioUploaded: boolean;
  audioUploadError: string | null;
  recordingError: string | null;
  onRetryAudioUpload: () => void;
  onContinueToAr: () => void;
  onBackToSetup: () => void;
};

export function SummaryScreen({
  turns,
  audioPreviewUrl,
  isAudioUploading,
  isAudioUploaded,
  audioUploadError,
  recordingError,
  onRetryAudioUpload,
  onContinueToAr,
  onBackToSetup
}: SummaryScreenProps) {
  return (
    <FlowShell stepLabel="COMPLETE">
      <div className="anim-fade-up">
        <p className="text-xs tracking-[0.08em] text-[#ffd700]">ROUND COMPLETE</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,8.8vw,2.5rem)] leading-none">TEAM FINISHED</h1>
        <p className="mt-2 text-sm leading-6 text-white/60">Good handoff flow. Team listened once first, then completed all singing turns.</p>
      </div>

      <Panel className="anim-fade-up mt-4 border-[rgba(255,215,0,0.3)] bg-[rgba(255,215,0,0.08)]">
        <p className="text-xs tracking-[0.08em] text-white/45">TURN TIMELINE</p>
        <div className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1">
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

      <Panel className="anim-fade-up mt-4 border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.08)]">
        <p className="text-xs tracking-[0.08em] text-[#00d4ff]">TEAM VOICE RECORDING</p>
        {audioPreviewUrl ? (
          <audio className="mt-3 w-full" controls preload="metadata" src={audioPreviewUrl} />
        ) : (
          <p className="mt-2 text-sm text-white/60">No team audio clip was captured for this round.</p>
        )}

        {isAudioUploading ? <p className="mt-3 text-xs text-[#ffd9b8]">Uploading team audio to bucket...</p> : null}
        {isAudioUploaded ? (
          <p className="mt-3 text-xs text-[#9effd3]">Bucket upload complete. Ending memories now use this recording.</p>
        ) : null}
        {audioUploadError ? <p className="mt-3 text-xs text-[#ff9fa4]">Audio upload failed: {audioUploadError}</p> : null}
        {recordingError ? <p className="mt-3 text-xs text-[#ff9fa4]">Audio capture warning: {recordingError}</p> : null}

        {audioUploadError && audioPreviewUrl ? (
          <button
            className="anim-elevate btn-fit mt-3 h-9 rounded-lg border border-white/15 text-xs text-white/80 transition-colors hover:border-white/30 hover:text-white"
            onClick={onRetryAudioUpload}
            type="button"
          >
            Retry upload
          </button>
        ) : null}
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
