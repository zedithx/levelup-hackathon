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
  expectedTargetIndex?: number;
  onBackToLobby: () => void;
  onCheckpointMatched: (targetIndex: number) => void;
};

export function RaceCameraScreen({
  config,
  checkpointImagePlaceholder,
  checkpointTargetMindSrc,
  expectedTargetIndex,
  onBackToLobby,
  onCheckpointMatched
}: RaceCameraScreenProps) {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [scanStatus, setScanStatus] = useState("Loading camera...");

  useEffect(() => {
    setIsCameraReady(false);
    setScanStatus("Loading camera...");
  }, [checkpointTargetMindSrc]);

  useEffect(() => {
    if (!isCameraReady) {
      setScanStatus("Loading camera...");
      return;
    }

    setScanStatus("Scanning for checkpoint match...");
  }, [isCameraReady]);

  return (
    <div className="anim-screen-in flex min-h-[100dvh] flex-col md:min-h-[852px]">
      <BrandBar />

      <div className="flex flex-1 flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3">
        <div className="anim-fade-up mb-3 rounded-[14px] border border-white/10 bg-white/5 px-3 py-2" style={reveal(40)}>
          <p className="text-[0.68rem] tracking-[0.18em] text-[#00d4ff]">{config.checkpoint.name.toUpperCase()}</p>
          <p className="text-xs text-white/40">{scanStatus}</p>
        </div>

        <div className="anim-fade-up relative h-[56dvh] min-h-[360px] max-h-[640px]" style={reveal(80)}>
          <MindARImageScene
            onTargetFound={(targetIndex) => {
              if (!isCameraReady) {
                return;
              }

              if (typeof expectedTargetIndex === "number" && targetIndex !== expectedTargetIndex) {
                setScanStatus("Wrong checkpoint image. Keep scanning this station marker.");
                return;
              }

              onCheckpointMatched(targetIndex);
            }}
            onArReadyChange={setIsCameraReady}
            scanningEnabled={isCameraReady}
            targetMindFileSrc={checkpointTargetMindSrc}
            targetIndexes={[0, 1, 2, 3]}
          />
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
        <button
          className="anim-elevate btn-fit anim-fade-up mt-1 h-9 w-full rounded-[10px] border border-dashed border-white/10 text-xs font-bold text-white/20 transition-colors hover:text-white/40"
          onClick={() => onCheckpointMatched(expectedTargetIndex ?? 0)}
          style={reveal(200)}
          type="button"
        >
          [DEV] Skip checkpoint scan
        </button>
      </div>
    </div>
  );
}
