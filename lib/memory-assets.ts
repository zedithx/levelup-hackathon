import { ENDING_CAROUSEL_DEFAULT_MEDIA } from "@/components/scape-pulse/flow/constants";
import type { EndingCarouselMedia } from "@/components/scape-pulse/flow/types";
import { readSharedTeamParticipants } from "@/lib/team-participants";

const STORAGE_KEY = "levelup.memory-assets.v1";
const MEMORY_EVENT = "levelup-memory-assets-updated";

type StoredDrawingAsset = {
  src: string;
  authorName: string;
};

type StoredMemoryAssets = {
  selfieImageSrc: string;
  danceVideoSrc: string;
  drawings: StoredDrawingAsset[];
  drawingActualWord: string;
  drawingFinalWord: string;
  finalSongAudioSrc: string;
  finalSongTitle: string;
  finalSongVoiceContributors: string[];
  finalSongBackgroundTrackSrc: string;
};

const EMPTY_MEMORY_ASSETS: StoredMemoryAssets = {
  selfieImageSrc: "",
  danceVideoSrc: "",
  drawings: [],
  drawingActualWord: "",
  drawingFinalWord: "",
  finalSongAudioSrc: "",
  finalSongTitle: "",
  finalSongVoiceContributors: [],
  finalSongBackgroundTrackSrc: ""
};

function isBrowser() {
  return typeof window !== "undefined";
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDrawings(value: unknown): StoredDrawingAsset[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const src = cleanString(record.src);
      const authorName = cleanString(record.authorName);

      if (!src) {
        return null;
      }

      return {
        src,
        authorName: authorName || "Unknown"
      };
    })
    .filter((item): item is StoredDrawingAsset => Boolean(item));
}

function normalizeContributors(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => cleanString(item))
    .filter(Boolean)
    .slice(0, 12);
}

function normalizeDrawingSrcList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => cleanString(item))
    .filter(Boolean);
}

function normalizeLegacyDrawings(value: unknown, fallbackAuthors: unknown): StoredDrawingAsset[] {
  const drawingSrcs = normalizeDrawingSrcList(value);

  if (!drawingSrcs.length) {
    return [];
  }

  const authorNames = Array.isArray(fallbackAuthors)
    ? fallbackAuthors.map((item) => cleanString(item))
    : [];

  return drawingSrcs.map((src, index) => ({
    src,
    authorName: authorNames[index] || `Player ${index + 1}`
  }));
}

function parseStoredAssets(raw: string | null): StoredMemoryAssets {
  if (!raw) {
    return EMPTY_MEMORY_ASSETS;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const finalSongRecord =
      parsed.finalSong && typeof parsed.finalSong === "object"
        ? (parsed.finalSong as Record<string, unknown>)
        : null;
    const normalizedDrawings = normalizeDrawings(parsed.drawings);
    const legacyDrawingsFromSlideShow = normalizeLegacyDrawings(
      parsed.drawingsSlideshowSrcs,
      parsed.drawingAuthorNames
    );
    const legacyDrawingsFromStringArray = normalizeLegacyDrawings(parsed.drawings, parsed.drawingAuthorNames);
    const legacyDrawings = legacyDrawingsFromSlideShow.length
      ? legacyDrawingsFromSlideShow
      : legacyDrawingsFromStringArray;
    const normalizedFinalSongContributors = normalizeContributors(parsed.finalSongVoiceContributors);
    const legacyFinalSongContributors = finalSongRecord
      ? normalizeContributors(finalSongRecord.voiceContributors)
      : [];

    return {
      selfieImageSrc: cleanString(parsed.selfieImageSrc) || cleanString(parsed.firstLocationImageSrc),
      danceVideoSrc: cleanString(parsed.danceVideoSrc) || cleanString(parsed.secondLocationDanceVideoSrc),
      drawings: normalizedDrawings.length ? normalizedDrawings : legacyDrawings,
      drawingActualWord: cleanString(parsed.drawingActualWord) || cleanString(parsed.actualWord),
      drawingFinalWord:
        cleanString(parsed.drawingFinalWord)
        || cleanString(parsed.finalWord)
        || cleanString(parsed.revealedGuess),
      finalSongAudioSrc: cleanString(parsed.finalSongAudioSrc) || cleanString(finalSongRecord?.audioSrc),
      finalSongTitle:
        cleanString(parsed.finalSongTitle)
        || cleanString(parsed.songTitle)
        || cleanString(finalSongRecord?.songTitle),
      finalSongVoiceContributors:
        normalizedFinalSongContributors.length
          ? normalizedFinalSongContributors
          : legacyFinalSongContributors,
      finalSongBackgroundTrackSrc:
        cleanString(parsed.finalSongBackgroundTrackSrc)
        || cleanString(finalSongRecord?.backgroundTrackSrc)
    };
  } catch {
    return EMPTY_MEMORY_ASSETS;
  }
}

function readStoredAssets(): StoredMemoryAssets {
  if (!isBrowser()) {
    return EMPTY_MEMORY_ASSETS;
  }

  return parseStoredAssets(window.localStorage.getItem(STORAGE_KEY));
}

function writeStoredAssets(nextAssets: StoredMemoryAssets) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAssets));
  window.dispatchEvent(new Event(MEMORY_EVENT));
}

export function saveSelfieMemoryAsset(imageSrc: string) {
  const current = readStoredAssets();
  writeStoredAssets({
    ...current,
    selfieImageSrc: imageSrc.trim()
  });
}

export function saveDanceMemoryAsset(videoSrc: string) {
  const current = readStoredAssets();
  writeStoredAssets({
    ...current,
    danceVideoSrc: videoSrc.trim()
  });
}

type SaveDrawingMemoryOptions = {
  actualWord?: string;
  finalWord?: string;
};

export function saveDrawingMemoryAssets(drawings: StoredDrawingAsset[], options: SaveDrawingMemoryOptions = {}) {
  const current = readStoredAssets();
  writeStoredAssets({
    ...current,
    drawings: normalizeDrawings(drawings),
    drawingActualWord: options.actualWord?.trim() || current.drawingActualWord,
    drawingFinalWord: options.finalWord?.trim() || current.drawingFinalWord
  });
}

type SaveFinalSongAssetOptions = {
  audioSrc: string;
  songTitle: string;
  voiceContributors: string[];
  backgroundTrackSrc?: string;
};

export function saveFinalSongMemoryAsset({
  audioSrc,
  songTitle,
  voiceContributors,
  backgroundTrackSrc
}: SaveFinalSongAssetOptions) {
  const current = readStoredAssets();

  writeStoredAssets({
    ...current,
    finalSongAudioSrc: audioSrc.trim(),
    finalSongTitle: songTitle.trim(),
    finalSongVoiceContributors: normalizeContributors(voiceContributors),
    finalSongBackgroundTrackSrc: backgroundTrackSrc?.trim() || current.finalSongBackgroundTrackSrc
  });
}

export function buildEndingCarouselMediaFromStoredAssets(): EndingCarouselMedia {
  const stored = readStoredAssets();
  const sharedParticipantNames = readSharedTeamParticipants()
    .map((participant) => participant.name.trim())
    .filter(Boolean);
  const fallbackDrawings = stored.drawings.length
    ? stored.drawings
    : ENDING_CAROUSEL_DEFAULT_MEDIA.drawings.map((drawing, index) => ({
      ...drawing,
      authorName: sharedParticipantNames[index] || drawing.authorName
    }));
  const fallbackVoiceContributors = sharedParticipantNames.length
    ? sharedParticipantNames
    : ENDING_CAROUSEL_DEFAULT_MEDIA.finalSong.voiceContributors;

  return {
    firstLocationImageSrc: stored.selfieImageSrc || ENDING_CAROUSEL_DEFAULT_MEDIA.firstLocationImageSrc,
    secondLocationDanceVideoSrc:
      stored.danceVideoSrc || ENDING_CAROUSEL_DEFAULT_MEDIA.secondLocationDanceVideoSrc,
    drawings: fallbackDrawings,
    drawingStory: {
      actualWord: stored.drawingActualWord || ENDING_CAROUSEL_DEFAULT_MEDIA.drawingStory.actualWord,
      finalWord: stored.drawingFinalWord || ENDING_CAROUSEL_DEFAULT_MEDIA.drawingStory.finalWord
    },
    finalSong: {
      audioSrc: stored.finalSongAudioSrc || ENDING_CAROUSEL_DEFAULT_MEDIA.finalSong.audioSrc,
      songTitle: stored.finalSongTitle || ENDING_CAROUSEL_DEFAULT_MEDIA.finalSong.songTitle,
      voiceContributors: stored.finalSongVoiceContributors.length
        ? stored.finalSongVoiceContributors
        : fallbackVoiceContributors,
      backgroundTrackSrc:
        stored.finalSongBackgroundTrackSrc || ENDING_CAROUSEL_DEFAULT_MEDIA.finalSong.backgroundTrackSrc
    }
  };
}

export function subscribeToMemoryAssetUpdates(onChange: () => void) {
  if (!isBrowser()) {
    return () => {};
  }

  const handler = () => onChange();

  window.addEventListener(MEMORY_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(MEMORY_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
