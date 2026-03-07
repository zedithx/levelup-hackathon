import { SING_PHASE_SEC } from "@/components/singing-game/flow/constants";
import type {
  DrawingGameMember,
  DrawingGameSong,
  SongLyricLine,
  TurnAllocation
} from "@/components/singing-game/flow/types";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function formatSeconds(value: number) {
  return `${value.toFixed(1)}s`;
}

export function buildTurns(members: DrawingGameMember[], song: DrawingGameSong): TurnAllocation[] {
  const trimmedDurationSec = Math.min(song.totalDurationSec, members.length * SING_PHASE_SEC);

  return members.map((member, memberIndex) => {
    const startSec = memberIndex * SING_PHASE_SEC;
    const endSec = Math.min(startSec + SING_PHASE_SEC, trimmedDurationSec);
    const durationSec = Math.max(0, endSec - startSec);

    return { member, memberIndex, startSec, endSec, durationSec };
  });
}

export function lyricLinesForTurn(lyrics: SongLyricLine[], turn: TurnAllocation) {
  return lyrics.filter((line) => line.endSec > turn.startSec && line.startSec < turn.endSec);
}

export function activeLyricIndex(lines: SongLyricLine[], absoluteSec: number) {
  if (!lines.length) {
    return -1;
  }

  const activeIndex = lines.findIndex((line) => absoluteSec >= line.startSec && absoluteSec < line.endSec);

  if (activeIndex >= 0) {
    return activeIndex;
  }

  if (absoluteSec >= lines[lines.length - 1].endSec) {
    return lines.length - 1;
  }

  return 0;
}
