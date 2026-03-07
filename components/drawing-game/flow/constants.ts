import type { DrawingGameMember, DrawingGameSong } from "@/components/drawing-game/flow/types";

export const PRE_GAME_COUNTDOWN_SEC = 3;
export const ORDER_REVEAL_MS = 2600;
export const PHASE_TICK_MS = 100;
export const MIN_MEMBERS = 2;
export const MAX_MEMBERS = 6;

export const PREVIEW_RATIO = 0.35;
export const MIN_PREVIEW_SEC = 1.2;
export const MAX_PREVIEW_SEC = 2;

export const MEMBER_EMOJI_POOL = ["🦊", "🐯", "🦁", "🐺", "🐉", "🦈", "🎤", "🔥"];

export const DEFAULT_MEMBERS: DrawingGameMember[] = [
  { id: "member-1", name: "Jun", emoji: "🦊", accent: "#ff6b00" },
  { id: "member-2", name: "Mia", emoji: "🐯", accent: "#00d4ff" },
  { id: "member-3", name: "Kai", emoji: "🦁", accent: "#ff3399" },
  { id: "member-4", name: "Lina", emoji: "🐺", accent: "#ffd700" },
  { id: "member-5", name: "Noah", emoji: "🎤", accent: "#ff8a3d" }
];

export const DRAWING_GAME_SONG: DrawingGameSong = {
  id: "city-rush",
  title: "City Rush",
  artist: "Pulse Crew",
  totalDurationSec: 20,
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
    { id: "l10", startSec: 18, endSec: 20, text: "We own the night" }
  ]
};
