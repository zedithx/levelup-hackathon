/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type ChangeEvent } from "react";

import type { RaceFlowConfig } from "@/components/scape-pulse/flow/types";
import { BrandBar } from "@/components/scape-pulse/flow/ui";
import { reveal } from "@/components/scape-pulse/flow/utils";
import { compressImageFile } from "@/lib/compress-image";

type RaceCameraScreenProps = {
  config: RaceFlowConfig;
  checkpointImagePlaceholder: string;
  checkpointTargetMindSrc: string;
  expectedTargetIndex?: number;
  missionBannerText?: string;
  onBackToLobby: () => void;
  onCheckpointMatched: (targetIndex: number) => void;
};

export function RaceCameraScreen({
  config,
  checkpointImagePlaceholder,
  expectedTargetIndex,
  missionBannerText,
  onBackToLobby,
  onCheckpointMatched
}: RaceCameraScreenProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [checkpointPhoto, setCheckpointPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [statusMessage, setStatusMessage] = useState("Take a photo of this checkpoint to continue.");
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    if (!checkpointPhoto) {
      setPhotoPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(checkpointPhoto);
    setPhotoPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [checkpointPhoto]);

  const openPicker = () => {
    fileInputRef.current?.click();
  };

  const onPhotoPicked = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;

    if (!nextFile.type.startsWith("image/")) {
      setStatusMessage("Please choose an image file.");
      return;
    }

    setIsCompressing(true);
    setStatusMessage("Processing photo...");
    const compressed = await compressImageFile(nextFile);
    setIsCompressing(false);
    setCheckpointPhoto(compressed);
    setStatusMessage("Photo captured. Confirm checkpoint when ready.");
  };

  const clearPhoto = () => {
    setCheckpointPhoto(null);
    setStatusMessage("Take a photo of this checkpoint to continue.");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const completeCheckpoint = () => {
    if (!checkpointPhoto) {
      setStatusMessage("Take a checkpoint photo before continuing.");
      return;
    }
    onCheckpointMatched(expectedTargetIndex ?? 0);
  };

  return (
    <div className="anim-screen-in flex min-h-[100dvh] flex-col md:min-h-[852px]">
      <BrandBar />

      <div className="flex flex-1 flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3">
        <div className="anim-fade-up mb-3 rounded-[14px] border border-white/10 bg-white/5 px-3 py-2" style={reveal(40)}>
          <p className="text-[0.68rem] tracking-[0.18em] text-[#00d4ff]">{config.checkpoint.name.toUpperCase()}</p>
          <p className="text-xs text-white/40">{statusMessage}</p>
        </div>

        {missionBannerText ? (
          <div className="anim-fade-up mb-3 rounded-[14px] border border-[#ff6b00]/30 bg-[rgba(255,107,0,0.10)] px-3 py-2" style={reveal(60)}>
            <p className="text-[0.62rem] tracking-[0.16em] text-[#ffb680]">MISSION RIDDLE</p>
            <p className="mt-1 text-xs leading-5 text-[#ffe3cf]">{missionBannerText}</p>
          </div>
        ) : null}

        <div className="anim-fade-up overflow-hidden rounded-[20px] border border-white/10 bg-[#101010]" style={reveal(80)}>
          {photoPreviewUrl ? (
            <img alt="Checkpoint capture preview" className="h-[56dvh] min-h-[360px] w-full object-cover" src={photoPreviewUrl} />
          ) : (
            <div className="flex h-[56dvh] min-h-[360px] flex-col items-center justify-center gap-3 px-6 text-center text-white/45">
              <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[0.65rem] tracking-[0.14em]">
                CAMERA
              </span>
              <p className="text-sm leading-6">
                Use your camera or gallery to capture this checkpoint image, then confirm to proceed.
              </p>
            </div>
          )}
        </div>

        <div className="anim-fade-up mt-3 rounded-[14px] border border-white/10 bg-[#111] p-3" style={reveal(120)}>
          <p className="mb-2 text-[0.7rem] tracking-[0.1em] text-white/30">REFERENCE IMAGE</p>
          <div className="flex items-center gap-3">
            <img
              alt={`${config.checkpoint.name} placeholder`}
              className="size-16 rounded-[10px] border border-white/10 bg-black object-cover"
              src={checkpointImagePlaceholder}
            />
            <p className="text-xs leading-5 text-white/45">
              Match this image/location and capture it with your camera.
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            className="anim-elevate btn-fit h-11 rounded-[12px] border border-[#00d4ff]/40 bg-[#00d4ff]/15 text-sm font-bold text-[#b8f4ff] transition-colors hover:border-[#00d4ff]/70 hover:bg-[#00d4ff]/25"
            onClick={openPicker}
            style={reveal(160)}
            type="button"
          >
            {isCompressing ? "Processing..." : checkpointPhoto ? "Retake Photo" : "Take Photo"}
          </button>
          <button
            className="anim-elevate btn-fit h-11 rounded-[12px] border border-white/10 bg-white/5 text-sm font-bold text-white/80 transition-colors hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:text-white/30"
            disabled={!checkpointPhoto}
            onClick={clearPhoto}
            style={reveal(180)}
            type="button"
          >
            Clear
          </button>
        </div>

        <input accept="image/*" capture="environment" className="hidden" onChange={onPhotoPicked} ref={fileInputRef} type="file" />

        <button
          className="anim-elevate btn-fit anim-fade-up mt-3 h-11 w-full rounded-[12px] border border-[#ff6b00]/40 bg-[#ff6b00]/20 text-sm font-bold text-[#ffd0b0] transition-colors hover:border-[#ff6b00]/70 hover:bg-[#ff6b00]/30 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/35"
          disabled={!checkpointPhoto || isCompressing}
          onClick={completeCheckpoint}
          style={reveal(200)}
          type="button"
        >
          Confirm Checkpoint
        </button>

        <button
          className="anim-elevate btn-fit anim-fade-up mt-3 h-11 w-full rounded-[12px] text-sm font-bold text-white/30 transition-colors hover:text-white/55"
          onClick={onBackToLobby}
          style={reveal(220)}
          type="button"
        >
          Exit to lobby
        </button>
      </div>
    </div>
  );
}
