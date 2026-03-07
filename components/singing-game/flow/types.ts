export type DrawingGameScreen =
  | "instructions"
  | "countdown"
  | "order"
  | "turn-sing"
  | "summary";

export type DrawingGameMember = {
  id: string;
  name: string;
  emoji: string;
  accent: string;
};

export type SongLyricLine = {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
};

export type DrawingGameSong = {
  id: string;
  title: string;
  artist: string;
  totalDurationSec: number;
  lyrics: SongLyricLine[];
};

export type TurnAllocation = {
  member: DrawingGameMember;
  memberIndex: number;
  startSec: number;
  endSec: number;
  durationSec: number;
};
