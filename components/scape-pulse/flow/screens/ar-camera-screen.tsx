"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { compressImageFile } from "@/lib/compress-image";

// import { RACE_FLOW_CONFIG } from "@/components/scape-pulse/flow/constants";
// import { MindARImageScene } from "@/components/scape-pulse/mindar-image-scene";

const STATION_ROUTE: Record<string, string> = {
  "0": "/selfie-flow",
  "1": "/dance-flow",
  "2": "/drawing-game",
  "3": "/singing-game",
};

export function ArCameraScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const station = searchParams.get("station") ?? "0";
  const sessionKey = `ar-camera-photo-${station}`;
  const nextRoute = STATION_ROUTE[station] ?? "/selfie-flow";

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string>("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [statusMessage, setStatusMessage] = useState("Take a photo of the station to continue.");

  // Restore persisted photo on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(sessionKey);
      if (saved) {
        setPhotoUrl(saved);
        setStatusMessage("Photo captured. Tap confirm to continue.");
      } else {
        setPhotoUrl("");
        setStatusMessage("Take a photo of the station to continue.");
      }
    } catch {}
  }, [sessionKey]);

  // Revoke object URL on unmount to free memory
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const onPhotoPicked = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 1. Show preview instantly — no encoding, no blocking
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const preview = URL.createObjectURL(file);
    objectUrlRef.current = preview;
    setPhotoUrl(preview);
    setStatusMessage("Photo captured. Tap confirm to continue.");

    // 2. Compress + persist to sessionStorage in the background after paint
    requestAnimationFrame(() => {
      compressImageFile(file).then((compressed) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          if (!dataUrl) return;
          try { sessionStorage.setItem(sessionKey, dataUrl); } catch {}
          // Swap preview to the persistent data URL so reload works
          URL.revokeObjectURL(preview);
          objectUrlRef.current = "";
          setPhotoUrl(dataUrl);
        };
        reader.readAsDataURL(compressed);
      });
    });
  };

  const confirm = () => {
    try { sessionStorage.removeItem(sessionKey); } catch {}
    router.push(nextRoute);
  };

  return (
    <div className="anim-screen-in flex min-h-[100dvh] flex-col bg-black md:min-h-[852px]">
      <div className="mx-auto flex h-[100dvh] w-full max-w-[393px] flex-col gap-3 px-4 py-4 md:h-[852px]">

        <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#101010] flex-1">
          {photoUrl ? (
            <img alt="Station capture" className="h-full w-full object-cover" src={photoUrl} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-white/45 px-6">
              <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[0.65rem] tracking-[0.14em]">
                CAMERA
              </span>
              <p className="text-sm leading-6">Point your camera at the station and take a photo.</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-white/60">{statusMessage}</p>

        <input accept="image/*" capture="environment" className="hidden" onChange={onPhotoPicked} ref={fileInputRef} type="file" />

        <button
          className="h-11 w-full rounded-[12px] border border-[#00d4ff]/40 bg-[#00d4ff]/15 text-sm font-bold text-[#b8f4ff]"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          {photoUrl ? "Retake Photo" : "Take Photo"}
        </button>

        <button
          className="h-11 w-full rounded-[12px] border border-[#ff6b00]/40 bg-[#ff6b00]/20 text-sm font-bold text-[#ffd0b0] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/35"
          disabled={!photoUrl}
          onClick={confirm}
          type="button"
        >
          Confirm Station
        </button>

      </div>
    </div>
  );
}
