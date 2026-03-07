import type { DrawingGameMember, DrawingGameSong } from "@/components/singing-game/flow/types";

export const PRE_GAME_COUNTDOWN_SEC = 3;
export const ORDER_REVEAL_MS = 2600;
export const PHASE_TICK_MS = 100;
export const MIN_MEMBERS = 2;
export const MAX_MEMBERS = 6;

export const SING_PHASE_SEC = 8;
export const SINGING_GAME_TRACK_SRC = "/music/bella-ciao.mp3";

export const MEMBER_EMOJI_POOL = ["🦊", "🐯", "🦁", "🐺", "🐉", "🦈", "🎤", "🔥"];

export const DEFAULT_MEMBERS: DrawingGameMember[] = [
  { id: "member-1", name: "Jun", emoji: "🦊", accent: "#ff6b00" },
  { id: "member-2", name: "Mia", emoji: "🐯", accent: "#00d4ff" },
  { id: "member-3", name: "Kai", emoji: "🦁", accent: "#ff3399" },
  { id: "member-4", name: "Lina", emoji: "🐺", accent: "#ffd700" },
  { id: "member-5", name: "Noah", emoji: "🎤", accent: "#ff8a3d" }
];

export const SINGING_GAME_SONG: DrawingGameSong = {
  id: "city-rush",
  title: "Bella Ciao",
  artist: "Traditional / Money Heist Version",
  totalDurationSec: 48,
  lyrics: [
    { id: "l1", startSec: 0, endSec: 2, text: "City lights are waking up" },
    { id: "l2", startSec: 2, endSec: 4, text: "Heartbeat starts to climb" },
    { id: "l3", startSec: 4, endSec: 6, text: "Hands up in the neon rush" },
    { id: "l4", startSec: 6, endSec: 8, text: "Voices lock in time" },
    { id: "l5", startSec: 8, endSec: 10, text: "Step left now spin around" },
    { id: "l6", startSec: 10, endSec: 12, text: "Feel the bassline rise" },
    { id: "l7", startSec: 12, endSec: 14, text: "Pass the fire to your friend" },
    { id: "l8", startSec: 14, endSec: 16, text: "Keep the rhythm tight" },
    { id: "l9", startSec: 16, endSec: 18, text: "One more line together now" },
    { id: "l10", startSec: 18, endSec: 20, text: "We own the night" },
    { id: "l11", startSec: 20, endSec: 22, text: "Neon echoes in the street" },
    { id: "l12", startSec: 22, endSec: 24, text: "Every voice is on the beat" },
    { id: "l13", startSec: 24, endSec: 26, text: "Throw your hands and call it out" },
    { id: "l14", startSec: 26, endSec: 28, text: "We are louder than the crowd" },
    { id: "l15", startSec: 28, endSec: 30, text: "Pass the mic and lock the pace" },
    { id: "l16", startSec: 30, endSec: 32, text: "Now the whole team takes the stage" },
    { id: "l17", startSec: 32, endSec: 34, text: "Shine the light and hold it high" },
    { id: "l18", startSec: 34, endSec: 36, text: "Watch the sparks across the sky" },
    { id: "l19", startSec: 36, endSec: 38, text: "Take one breath and hit the line" },
    { id: "l20", startSec: 38, endSec: 40, text: "Every section stays in time" },
    { id: "l21", startSec: 40, endSec: 42, text: "Final chorus, bring the fire" },
    { id: "l22", startSec: 42, endSec: 44, text: "Higher now and even higher" },
    { id: "l23", startSec: 44, endSec: 46, text: "One team moving as a wave" },
    { id: "l24", startSec: 46, endSec: 48, text: "This is our relay, we are brave" }
  ]
};
