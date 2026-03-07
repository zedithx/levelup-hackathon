import {
  MAX_PREVIEW_SEC,
  MIN_PREVIEW_SEC,
  PREVIEW_RATIO
} from "@/components/drawing-game/flow/constants";
import type {
  DrawingGameMember,
  DrawingGameSong,
  SongLyricLine,
  TurnAllocation
} from "@/components/drawing-game/flow/types";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function formatSeconds(value: number) {
  return `${value.toFixed(1)}s`;
}

export function distributeDuration(totalDurationSec: number, slotCount: number) {
  if (slotCount <= 0) {
    return [];
  }

  const base = Math.floor(totalDurationSec / slotCount);
  const remainder = totalDurationSec % slotCount;

  return Array.from({ length: slotCount }, (_, index) => base + (index < remainder ? 1 : 0));
}

export function buildTurns(members: DrawingGameMember[], song: DrawingGameSong): TurnAllocation[] {
  const durations = distributeDuration(song.totalDurationSec, members.length);
  let cursorSec = 0;

  return members.map((member, memberIndex) => {
    const durationSec = durations[memberIndex] ?? 0;
    const startSec = cursorSec;
    const endSec = startSec + durationSec;
    const previewSec = clamp(durationSec * PREVIEW_RATIO, MIN_PREVIEW_SEC, MAX_PREVIEW_SEC);

    cursorSec = endSec;

    return {
      member,
      memberIndex,
      startSec,
      endSec,
      durationSec,
      previewSec
    };
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
