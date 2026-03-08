import { BrandBar, PrimaryButton } from "@/components/scape-pulse/flow/ui";
import { reveal } from "@/components/scape-pulse/flow/utils";

type CameraPermissionScreenProps = {
  checkpointImagePlaceholder: string;
  checkpointTargetMindSrc: string;
  cameraPermissionError: string | null;
  isRequestingCameraPermission: boolean;
  onCheckpointImagePlaceholderChange: (value: string) => void;
  onCheckpointTargetMindSrcChange: (value: string) => void;
  onRequestCameraPermission: () => void;
  onBackToLobby: () => void;
};

export function CameraPermissionScreen({
  checkpointImagePlaceholder,
  checkpointTargetMindSrc,
  cameraPermissionError,
  isRequestingCameraPermission,
  onCheckpointImagePlaceholderChange,
  onCheckpointTargetMindSrcChange,
  onRequestCameraPermission,
  onBackToLobby
}: CameraPermissionScreenProps) {
  return (
    <div className="anim-screen-in flex min-h-[100dvh] flex-col md:min-h-[852px]">
      <BrandBar />

      <div className="flex flex-1 flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-6">
        <div className="anim-fade-up rounded-[16px] border border-[#00d4ff]/35 bg-[rgba(0,212,255,0.08)] px-4 py-5">
          <p className="text-xs tracking-[0.2em] text-[#00d4ff]">CAMERA ACCESS</p>
          <h1 className="mt-2 font-display text-[clamp(1.85rem,8.2vw,2.2rem)] leading-none text-white">
            READY FOR AR RACE
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/55">
            Next step asks for camera permission. After that, your squad will move into the live AR view with Pingo.
          </p>
        </div>

        <div className="anim-fade-up mt-4 space-y-3 rounded-[16px] border border-white/10 bg-[#111] p-4" style={reveal(80)}>
          <div>
            <label className="mb-1 block text-[0.7rem] tracking-[0.08em] text-white/30" htmlFor="checkpoint-image-src">
              CHECKPOINT IMAGE PLACEHOLDER URL
            </label>
            <input
              className="h-11 w-full rounded-[12px] border border-white/10 bg-[#050505] px-3 text-sm text-white placeholder:text-white/35 focus:border-[#00d4ff] focus:outline-none"
              id="checkpoint-image-src"
              onChange={(event) => onCheckpointImagePlaceholderChange(event.target.value)}
              placeholder="https://example.com/checkpoint.png"
              value={checkpointImagePlaceholder}
            />
          </div>
          <div>
            <label className="mb-1 block text-[0.7rem] tracking-[0.08em] text-white/30" htmlFor="checkpoint-target-src">
              MINDAR TARGET URL (.MIND)
            </label>
            <input
              className="h-11 w-full rounded-[12px] border border-white/10 bg-[#050505] px-3 text-sm text-white placeholder:text-white/35 focus:border-[#00d4ff] focus:outline-none"
              id="checkpoint-target-src"
              onChange={(event) => onCheckpointTargetMindSrcChange(event.target.value)}
              placeholder="https://example.com/checkpoint.mind"
              value={checkpointTargetMindSrc}
            />
          </div>
          <p className="text-xs leading-5 text-white/35">
            Placeholder is configurable now. MindAR matching uses the `.mind` target file.
          </p>
        </div>

        {cameraPermissionError ? (
          <p className="anim-fade-up mt-3 rounded-[12px] border border-[#ff6b00]/35 bg-[rgba(255,107,0,0.1)] px-3 py-2 text-xs leading-5 text-[#ffc69f]">
            {cameraPermissionError}
          </p>
        ) : null}

        <div className="anim-fade-up mt-auto space-y-2" style={reveal(160)}>
          <PrimaryButton
            disabled={isRequestingCameraPermission}
            label={isRequestingCameraPermission ? "Requesting Camera..." : "Enable Camera"}
            onClick={onRequestCameraPermission}
          />
          <button
            className="anim-elevate btn-fit h-11 w-full text-sm font-bold text-white/25 transition-colors hover:text-white/55"
            onClick={onBackToLobby}
            type="button"
          >
            Back to lobby
          </button>
        </div>
      </div>
    </div>
  );
}
