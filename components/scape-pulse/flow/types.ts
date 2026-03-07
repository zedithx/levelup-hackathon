export type FlowScreen =
  | "intro-1"
  | "intro-2"
  | "intro-3"
  | "intro-4"
  | "class-code"
  | "profile"
  | "handoff"
  | "lobby"
  | "camera-permission"
  | "ar-race"
  | "checkpoint-cleared"
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
