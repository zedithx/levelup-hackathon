import type {
  EndingCarouselMedia,
  OnboardingSlide,
  RaceFlowConfig
} from "@/components/scape-pulse/flow/types";

export const ASSETS = {
  logoZap:      "/icons/zap.svg",
  arrowRight:   "/icons/arrow-right.svg",
  stepOneIcon:  "/icons/map.svg",
  stepTwoIcon:  "/icons/users.svg",
  stepThreeIcon:"/icons/target.svg",
  stepFourIcon: "/icons/trophy.svg",
  classCodeIcon:"/icons/hash.svg",
  profileIcon:  "/icons/user.svg",
  swordsIcon:   "/icons/swords.svg",
  crownIcon:    "/icons/crown.svg",
  phoneIcon:    "/icons/phone.svg",
  editIcon:     "/icons/edit.svg",
  userPlusIcon: "/icons/user-plus.svg",
  botIcon:      "/icons/bot.svg",
  checkIcon:    "/icons/check.svg",
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
    name: "Mission 1: The Robot Ride",
    imagePlaceholderSrc:
      "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.1.4/examples/image-tracking/assets/card-example/card.png",
    targetMindFileSrc: "/station-references/stations.mind"
  },
  dialogue: [
    {
      id: "mission-1-riddle",
      speaker: "Pingo",
      message: "Go all the way down to B1. Find the white car with the orange robot arm sitting on the checkered floor.",
      ctaLabel: "On my way!"
    },
    {
      id: "mission-1-scan",
      speaker: "Pingo",
      message: "Point your camera at the target image to confirm you've found it!",
      ctaLabel: "Start Scanning"
    }
  ]
};

export const INTER_STATION_GUIDES = {
  toSelfie: {
    checkpointName: "Station 2: Team Selfie",
    hint: "Head to the Atrium and take the ultimate team selfie together!"
  },
  toDance: {
    checkpointName: "Station 3: Butterfly Dance",
    hint: "Make your way to Butterfly Station for the viral team dance challenge!"
  },
  toDrawing: {
    checkpointName: "Station 4: Monster Drawing",
    hint: "Head to Monster Station — one sees the word, the rest must draw it!"
  },
  toSinging: {
    checkpointName: "Station 5: Balcony Singing",
    hint: "Head up to the Balcony for the singing challenge — time to perform!"
  },
  toCelebration: {
    checkpointName: "Grand Finale",
    hint: "All challenges complete — head back to the main hall for the grand reveal!"
  }
} as const;

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
