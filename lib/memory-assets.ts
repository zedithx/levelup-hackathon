import { ENDING_CAROUSEL_DEFAULT_MEDIA } from "@/components/scape-pulse/flow/constants";
import type { EndingCarouselMedia } from "@/components/scape-pulse/flow/types";

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
  finalSongAudioSrc: string;
  finalSongTitle: string;
  finalSongVoiceContributors: string[];
};

const EMPTY_MEMORY_ASSETS: StoredMemoryAssets = {
  selfieImageSrc: "",
  danceVideoSrc: "",
  drawings: [],
  finalSongAudioSrc: "",
  finalSongTitle: "",
  finalSongVoiceContributors: []
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

function parseStoredAssets(raw: string | null): StoredMemoryAssets {
  if (!raw) {
    return EMPTY_MEMORY_ASSETS;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    return {
      selfieImageSrc: cleanString(parsed.selfieImageSrc),
      danceVideoSrc: cleanString(parsed.danceVideoSrc),
      drawings: normalizeDrawings(parsed.drawings),
      finalSongAudioSrc: cleanString(parsed.finalSongAudioSrc),
      finalSongTitle: cleanString(parsed.finalSongTitle),
      finalSongVoiceContributors: normalizeContributors(parsed.finalSongVoiceContributors)
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

export function saveDrawingMemoryAssets(drawings: StoredDrawingAsset[]) {
  const current = readStoredAssets();
  writeStoredAssets({
    ...current,
    drawings: normalizeDrawings(drawings)
  });
}

type SaveFinalSongAssetOptions = {
  audioSrc: string;
  songTitle: string;
  voiceContributors: string[];
};

export function saveFinalSongMemoryAsset({ audioSrc, songTitle, voiceContributors }: SaveFinalSongAssetOptions) {
  const current = readStoredAssets();

  writeStoredAssets({
    ...current,
    finalSongAudioSrc: audioSrc.trim(),
    finalSongTitle: songTitle.trim(),
    finalSongVoiceContributors: normalizeContributors(voiceContributors)
  });
}

export function buildEndingCarouselMediaFromStoredAssets(): EndingCarouselMedia {
  const stored = readStoredAssets();

  return {
    firstLocationImageSrc: stored.selfieImageSrc || ENDING_CAROUSEL_DEFAULT_MEDIA.firstLocationImageSrc,
    secondLocationDanceVideoSrc:
      stored.danceVideoSrc || ENDING_CAROUSEL_DEFAULT_MEDIA.secondLocationDanceVideoSrc,
    drawings: stored.drawings.length ? stored.drawings : ENDING_CAROUSEL_DEFAULT_MEDIA.drawings,
    finalSong: {
      audioSrc: stored.finalSongAudioSrc || ENDING_CAROUSEL_DEFAULT_MEDIA.finalSong.audioSrc,
      songTitle: stored.finalSongTitle || ENDING_CAROUSEL_DEFAULT_MEDIA.finalSong.songTitle,
      voiceContributors: stored.finalSongVoiceContributors.length
        ? stored.finalSongVoiceContributors
        : ENDING_CAROUSEL_DEFAULT_MEDIA.finalSong.voiceContributors
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
