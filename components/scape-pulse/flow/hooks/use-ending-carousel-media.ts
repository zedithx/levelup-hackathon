"use client";

import { useEffect, useState } from "react";

import { ENDING_CAROUSEL_DEFAULT_MEDIA } from "@/components/scape-pulse/flow/constants";
import type { EndingCarouselMedia } from "@/components/scape-pulse/flow/types";
import { buildEndingCarouselMediaFromStoredAssets, subscribeToMemoryAssetUpdates } from "@/lib/memory-assets";

export function useEndingCarouselMedia() {
  const [media, setMedia] = useState<EndingCarouselMedia>(ENDING_CAROUSEL_DEFAULT_MEDIA);

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
