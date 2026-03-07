"use client";

import { useEffect, useState } from "react";

import type { EndingCarouselMedia } from "@/components/scape-pulse/flow/types";
import { buildEndingCarouselMediaFromStoredAssets, subscribeToMemoryAssetUpdates } from "@/lib/memory-assets";

export function useEndingCarouselMedia() {
  const [media, setMedia] = useState<EndingCarouselMedia>(() => buildEndingCarouselMediaFromStoredAssets());

  useEffect(() => {
    const refresh = () => {
      setMedia(buildEndingCarouselMediaFromStoredAssets());
    };

    refresh();
    const unsubscribe = subscribeToMemoryAssetUpdates(refresh);

    return unsubscribe;
  }, []);

  return media;
}
