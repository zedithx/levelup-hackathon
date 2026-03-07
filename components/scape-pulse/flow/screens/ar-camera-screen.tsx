"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { RACE_FLOW_CONFIG } from "@/components/scape-pulse/flow/constants";
import { MindARImageScene } from "@/components/scape-pulse/mindar-image-scene";

const STATION_FLOW_ROUTE_BY_INDEX: Record<number, string> = {
  0: "/selfie-flow",
  1: "/dance-flow",
  2: "/drawing-game",
  3: "/singing-game"
};

export function ArCameraScreen() {
  const router = useRouter();
  const hasNavigatedRef = useRef(false);
  const [statusMessage, setStatusMessage] = useState("Point camera at a station reference image.");

  return (
    <div className="anim-screen-in min-h-[100dvh] bg-black md:min-h-[852px]">
      <div className="mx-auto h-[100dvh] w-full max-w-[393px] px-4 py-4 md:h-[852px]">
        <MindARImageScene
          onTargetFound={(targetIndex) => {
            if (hasNavigatedRef.current) {
              return;
            }

            const route = STATION_FLOW_ROUTE_BY_INDEX[targetIndex];
            if (!route) {
              setStatusMessage(`Station index ${targetIndex} matched but no game route is mapped.`);
              return;
            }

            hasNavigatedRef.current = true;
            setStatusMessage(`Station ${targetIndex} matched. Opening game...`);
            router.push(route);
          }}
          scanningEnabled
          targetMindFileSrc={RACE_FLOW_CONFIG.checkpoint.targetMindFileSrc}
          targetIndexes={[0, 1, 2, 3]}
        />
        <p className="mt-3 text-center text-xs text-white/60">{statusMessage}</p>
      </div>
    </div>
  );
}
