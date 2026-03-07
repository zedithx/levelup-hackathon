"use client";

import { useRouter } from "next/navigation";

import { ENDING_CAROUSEL_DEFAULT_MEDIA } from "@/components/scape-pulse/flow/constants";
import { FinalDestinationCarouselScreen } from "@/components/scape-pulse/flow/screens/final-destination-carousel-screen";

export default function CelebratoryFlowPage() {
  const router = useRouter();

  return (
    <FinalDestinationCarouselScreen
      media={ENDING_CAROUSEL_DEFAULT_MEDIA}
      onBackToLobby={() => router.push("/")}
    />
  );
}
