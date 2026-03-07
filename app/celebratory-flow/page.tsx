"use client";

import { useEndingCarouselMedia } from "@/components/scape-pulse/flow/hooks/use-ending-carousel-media";
import { FinalDestinationCarouselScreen } from "@/components/scape-pulse/flow/screens/final-destination-carousel-screen";

export default function CelebratoryFlowPage() {
  const media = useEndingCarouselMedia();

  return <FinalDestinationCarouselScreen media={media} />;
}
