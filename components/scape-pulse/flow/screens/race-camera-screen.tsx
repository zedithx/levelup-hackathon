/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

import { MindARImageScene } from "@/components/scape-pulse/mindar-image-scene";
import type { RaceFlowConfig } from "@/components/scape-pulse/flow/types";
import { BrandBar } from "@/components/scape-pulse/flow/ui";
import { reveal } from "@/components/scape-pulse/flow/utils";

type RaceCameraScreenProps = {
  config: RaceFlowConfig;
  checkpointImagePlaceholder: string;
  checkpointTargetMindSrc: string;
  onBackToLobby: () => void;
  onCheckpointMatched: (targetIndex: number) => void;
};

export function RaceCameraScreen({
  config,
  checkpointImagePlaceholder,
  checkpointTargetMindSrc,
  onBackToLobby,
  onCheckpointMatched
}: RaceCameraScreenProps) {
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    setIsCameraReady(false);
  }, [checkpointTargetMindSrc]);

  return (
    <div className="anim-screen-in flex min-h-[100dvh] flex-col md:min-h-[852px]">
      <BrandBar />

      <div className="flex flex-1 flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3">
        <div className="anim-fade-up mb-3 rounded-[14px] border border-white/10 bg-white/5 px-3 py-2" style={reveal(40)}>
          <p className="text-[0.68rem] tracking-[0.18em] text-[#00d4ff]">{config.checkpoint.name.toUpperCase()}</p>
          <p className="text-xs text-white/40">
            {isCameraReady ? "Scanning for checkpoint match..." : "Loading camera..."}
          </p>
        </div>

        <div className="anim-fade-up relative h-[56dvh] min-h-[360px] max-h-[640px]" style={reveal(80)}>
          <MindARImageScene
            onTargetFound={(targetIndex) => {
              if (isCameraReady && dialogueComplete) {
                onCheckpointMatched(targetIndex);
              }
            }}
            onArReadyChange={setIsCameraReady}
            scanningEnabled={isCameraReady}
            targetMindFileSrc={checkpointTargetMindSrc}
            targetIndexes={[0, 1, 2, 3]}
          />

          {isCameraReady && !dialogueComplete && activeDialogue ? (
            <div className="pointer-events-none absolute inset-x-3 bottom-3">
              <div className="pointer-events-auto rounded-[16px] border border-[#ff3399]/40 bg-[rgba(10,10,10,0.92)] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
                <p className="text-[0.72rem] tracking-[0.2em] text-[#ff3399]">{activeDialogue.speaker.toUpperCase()}</p>
                <p className="mt-2 text-sm leading-6 text-white/80">{activeDialogue.message}</p>
                <div className="mt-4">
                  <PrimaryButton fullWidth={false} label={activeDialogue.ctaLabel} onClick={onAdvanceDialogue} />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="anim-fade-up mt-3 rounded-[14px] border border-white/10 bg-[#111] p-3" style={reveal(120)}>
          <p className="mb-2 text-[0.7rem] tracking-[0.1em] text-white/30">CHECKPOINT IMAGE</p>
          <div className="flex items-center gap-3">
            <img
              alt={`${config.checkpoint.name} placeholder`}
              className="size-16 rounded-[10px] border border-white/10 bg-black object-cover"
              src={checkpointImagePlaceholder}
            />
            <p className="text-xs leading-5 text-white/45">
              Point your camera at this image to unlock the checkpoint.
            </p>
          </div>
        </div>

        <button
          className="anim-elevate btn-fit anim-fade-up mt-3 h-11 w-full rounded-[12px] text-sm font-bold text-white/30 transition-colors hover:text-white/55"
          onClick={onBackToLobby}
          style={reveal(160)}
          type="button"
        >
          Exit to lobby
        </button>
      </div>
    </div>
  );
}
