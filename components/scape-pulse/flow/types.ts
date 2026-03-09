export type FlowScreen =
  | "intro-1"
  | "intro-2"
  | "intro-3"
  | "intro-4"
  | "class-code"
  | "profile"
  | "handoff"
  | "lobby"
  | "character-selection"
  | "mascot-selection"
  | "ar-guide"
  | "camera-permission"
  | "ar-race"
  | "ar-race-dance"
  | "ar-race-drawing"
  | "checkpoint-cleared"
  | "selfie"
  | "ar-guide-to-dance"
  | "dance"
  | "ar-guide-to-drawing"
  | "drawing"
  | "ar-guide-to-singing"
  | "singing"
  | "ar-guide-to-celebration"
  | "final-destination-carousel";

export type OnboardingSlide = {
  id: Extract<FlowScreen, "intro-1" | "intro-2" | "intro-3" | "intro-4">;
  progressStep: 1 | 2 | 3 | 4;
  stepLabel: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accent: {
    color: string;
    tileBackground: string;
    tileBorder: string;
    orb: string;
  };
  ctaLabel: string;
};

export type TeamMember = {
  id: string;
  avatar: string;
  name: string;
  role: "Gamemaster" | "Teammate";
  isLeader?: boolean;
};

export type RaceDialogueStep = {
  id: string;
  speaker: string;
  message: string;
  ctaLabel: string;
};

export type RaceFlowConfig = {
  mascotName: string;
  checkpoint: {
    name: string;
    imagePlaceholderSrc: string;
    targetMindFileSrc: string;
  };
  dialogue: RaceDialogueStep[];
  /** Set at runtime once the player finishes mascot customisation. */
  avatarConfig?: import("@/components/scape-pulse/avatar-builders").AvatarConfig;
};

export type EndingCarouselMedia = {
  firstLocationImageSrc: string;
  secondLocationDanceVideoSrc: string;
  drawings: Array<{
    src: string;
    authorName: string;
  }>;
  drawingStory: {
    actualWord: string;
    finalWord: string;
  };
  finalSong: {
    audioSrc: string;
    songTitle: string;
    voiceContributors: string[];
    backgroundTrackSrc: string;
  };
};
