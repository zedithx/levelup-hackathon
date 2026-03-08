import type {
  EndingCarouselMedia,
  OnboardingSlide,
  RaceFlowConfig
} from "@/components/scape-pulse/flow/types";

export const ASSETS = {
  logoZap: "https://www.figma.com/api/mcp/asset/8b9ab8d9-9f3d-44b8-ba8d-99ba8b05f972",
  arrowRight:
    "https://www.figma.com/api/mcp/asset/f0932723-fe47-4f4e-a993-ed78deb0729a",
  stepOneIcon:
    "https://www.figma.com/api/mcp/asset/477c8aa6-0add-4990-b200-839803cd8157",
  stepTwoIcon:
    "https://www.figma.com/api/mcp/asset/cb90dc89-50a7-4713-95dd-eaf7a744cf56",
  stepThreeIcon:
    "https://www.figma.com/api/mcp/asset/269d977d-c915-49cf-9682-853b7cadc7ee",
  stepFourIcon:
    "https://www.figma.com/api/mcp/asset/0b8a7b52-857b-462c-806a-69ce8c26d5c1",
  classCodeIcon:
    "https://www.figma.com/api/mcp/asset/31d73bef-1eec-490d-92e6-87ac12f91789",
  profileIcon:
    "https://www.figma.com/api/mcp/asset/c252c5dc-2b00-434c-b7a1-4d20b9738a9e",
  swordsIcon:
    "https://www.figma.com/api/mcp/asset/c51dc71e-10f4-486e-810a-a61638ab7aeb",
  crownIcon:
    "https://www.figma.com/api/mcp/asset/6cb4c8a3-7d97-4bd9-ae39-55c79d080ec8",
  phoneIcon:
    "https://www.figma.com/api/mcp/asset/be2451f4-0ca6-4b62-8759-1361345e2351",
  editIcon:
    "https://www.figma.com/api/mcp/asset/66beb011-30a2-4afa-8537-9c5d7a6a24d7",
  userPlusIcon:
    "https://www.figma.com/api/mcp/asset/3c191494-d4b9-4f2e-82c1-e95dbdb94bca",
  botIcon: "https://www.figma.com/api/mcp/asset/e0edd825-ac07-429b-ad7e-d578e405f4f3",
  checkIcon:
    "https://www.figma.com/api/mcp/asset/0444442b-f1b5-4918-8b80-e0e4d3848202"
} as const;

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "intro-1",
    progressStep: 1,
    stepLabel: "STEP 1 OF 4",
    title: "WELCOME TO PULSE",
    subtitle: "Your school adventure starts now.",
    description:
      "Pulse is a gamified experience across your school grounds - your squad will explore stations, solve challenges, and compete to be the top team. All from one shared phone!",
    icon: ASSETS.stepOneIcon,
    accent: {
      color: "#ff6b00",
      tileBackground: "rgba(255,107,0,0.08)",
      tileBorder: "rgba(255,107,0,0.2)",
      orb: "rgba(255,107,0,0.27)"
    },
    ctaLabel: "Next"
  },
  {
    id: "intro-2",
    progressStep: 2,
    stepLabel: "STEP 2 OF 4",
    title: "HOW IT WORKS",
    subtitle: "Team up. Play. Conquer.",
    description:
      "Your team shares one phone. Visit each station around school, complete quick challenges together - trivia, puzzles, photo missions - and rack up points as a squad.",
    icon: ASSETS.stepTwoIcon,
    accent: {
      color: "#00d4ff",
      tileBackground: "rgba(0,212,255,0.08)",
      tileBorder: "rgba(0,212,255,0.2)",
      orb: "rgba(0,212,255,0.27)"
    },
    ctaLabel: "Next"
  },
  {
    id: "intro-3",
    progressStep: 3,
    stepLabel: "STEP 3 OF 4",
    title: "MEET YOUR AR BUDDY",
    subtitle: "A mascot that guides you IRL.",
    description:
      "After each challenge, your AR mascot pops up on screen and shows you the way to the next station with a 3D arrow. Follow it through your school - no map needed!",
    icon: ASSETS.stepThreeIcon,
    accent: {
      color: "#ff3399",
      tileBackground: "rgba(255,51,153,0.08)",
      tileBorder: "rgba(255,51,153,0.2)",
      orb: "rgba(255,51,153,0.27)"
    },
    ctaLabel: "Next"
  },
  {
    id: "intro-4",
    progressStep: 4,
    stepLabel: "STEP 4 OF 4",
    title: "CLIMB THE RANKS",
    subtitle: "Class vs. class. Squad vs. squad.",
    description:
      "Scores are tracked live on the leaderboard. Compete against other teams across school - top squads win bragging rights and prizes. Speed bonuses for finishing fast!",
    icon: ASSETS.stepFourIcon,
    accent: {
      color: "#ffd700",
      tileBackground: "rgba(255,215,0,0.08)",
      tileBorder: "rgba(255,215,0,0.2)",
      orb: "rgba(255,215,0,0.27)"
    },
    ctaLabel: "Let's Go"
  }
];

export const AVATAR_CHOICES = [
  "🦊",
  "🐯",
  "🦁",
  "🐺",
  "🦅",
  "🐉",
  "🦈",
  "🐙",
  "🦖",
  "🎯",
  "⚡",
  "🔥",
  "💎",
  "🌟",
  "🚀",
  "🎮"
];

export const LOBBY_AVATAR_CHOICES = [
  "🦊",
  "🐯",
  "🦁",
  "🐺",
  "🦅",
  "🐉",
  "🦈",
  "🐙",
  "🦖",
  "🎯",
  "⚡",
  "🔥",
  "💎",
  "🌟",
  "🚀",
  "🎮"
];

export const RACE_FLOW_CONFIG: RaceFlowConfig = {
  mascotName: "Pingo",
  checkpoint: {
    name: "Checkpoint 1",
    imagePlaceholderSrc:
      "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.1.4/examples/image-tracking/assets/card-example/card.png",
    targetMindFileSrc: "/station-references/stations.mind"
  },
  dialogue: [
    {
      id: "pingo-intro",
      speaker: "Pingo",
      message: "Race start! I am Pingo, your AR guide. I will lead your squad checkpoint by checkpoint.",
      ctaLabel: "Next"
    },
    {
      id: "checkpoint-1-brief",
      speaker: "Pingo",
      message:
        "First checkpoint is live. Point the camera at the checkpoint target image to match and unlock it.",
      ctaLabel: "Start Scanning"
    }
  ]
};

export const ENDING_CAROUSEL_DEFAULT_MEDIA: EndingCarouselMedia = {
  firstLocationImageSrc: "https://placehold.co/1440x960/101010/ffffff?text=First+Game+Memory",
  secondLocationDanceVideoSrc: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  drawings: [
    {
      src: "https://placehold.co/1200x900/1b2335/f5f7ff?text=Drawing+1",
      authorName: "Jun"
    },
    {
      src: "https://placehold.co/1200x900/2b152c/ffe6f2?text=Drawing+2",
      authorName: "Tania"
    },
    {
      src: "https://placehold.co/1200x900/113224/e7fff4?text=Drawing+3",
      authorName: "Kai"
    },
    {
      src: "https://placehold.co/1200x900/2f2614/fff8dc?text=Drawing+4",
      authorName: "Mika"
    }
  ],
  drawingStory: {
    actualWord: "Moonwalk",
    finalWord: "Moonwalk"
  },
  finalSong: {
    audioSrc: "/music/bella-ciao.mp3",
    songTitle: "Bella Ciao",
    voiceContributors: ["Jun", "Tania", "Kai", "Mika"],
    backgroundTrackSrc: "/music/bella-ciao.mp3"
  }
};
