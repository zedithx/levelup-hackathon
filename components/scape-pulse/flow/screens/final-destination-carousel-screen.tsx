/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";

import type { EndingCarouselMedia } from "@/components/scape-pulse/flow/types";
import { BrandBar, PrimaryButton } from "@/components/scape-pulse/flow/ui";
import { cn, reveal } from "@/components/scape-pulse/flow/utils";

const ENDING_SLIDE_DURATION_MS = 9000;
const DRAWING_FRAME_DURATION_MS = 2400;

type FinalDestinationCarouselScreenProps = {
  media: EndingCarouselMedia;
  onBackToLobby: () => void;
};

type EndingSlide = {
  id: "first-game-memory" | "group-dance" | "drawings-gallery" | "final-song";
  stepLabel: string;
  title: string;
  description: string;
  accentClass: string;
};

const ENDING_SLIDES: EndingSlide[] = [
  {
    id: "first-game-memory",
    stepLabel: "LOCATION 1 MEMORY",
    title: "Where The Journey Started",
    description:
      "A still frame from your first game/location appears first to anchor the whole experience emotionally.",
    accentClass: "text-[#ff6b00]"
  },
  {
    id: "group-dance",
    stepLabel: "LOCATION 2 RECORDING",
    title: "Squad Dance Moment",
    description:
      "Then the group dance recording takes over the stage so everyone relives the second game together.",
    accentClass: "text-[#00d4ff]"
  },
  {
    id: "drawings-gallery",
    stepLabel: "TEAM ART SHOWCASE",
    title: "All Drawings In Motion",
    description:
      "Your drawings rotate as a mini-gallery with soft transitions, like a memory wall coming alive.",
    accentClass: "text-[#ff3399]"
  },
  {
    id: "final-song",
    stepLabel: "FINAL DESTINATION",
    title: "The Song Finale",
    description:
      "The ending lands on your team voice recording of everyone singing the song title together.",
    accentClass: "text-[#ffd700]"
  }
];

export function FinalDestinationCarouselScreen({ media, onBackToLobby }: FinalDestinationCarouselScreenProps) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [slideProgress, setSlideProgress] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [drawingFrameIndex, setDrawingFrameIndex] = useState(0);

  const drawings = useMemo(
    () => media.drawings.filter((drawing) => drawing.src.trim()),
    [media.drawings]
  );

  const activeSlide = ENDING_SLIDES[activeSlideIndex];
  const canMovePrevious = activeSlideIndex > 0;
  const canMoveNext = activeSlideIndex < ENDING_SLIDES.length - 1;
  const safeDrawingIndex = drawings.length ? drawingFrameIndex % drawings.length : 0;
  const activeDrawing = drawings[safeDrawingIndex];

  useEffect(() => {
    setSlideProgress(0);
  }, [activeSlideIndex]);

  useEffect(() => {
    if (!isAutoPlaying) {
      return;
    }

    const startTime = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / ENDING_SLIDE_DURATION_MS) * 100);
      setSlideProgress(progress);

      if (progress < 100) {
        return;
      }

      if (activeSlideIndex >= ENDING_SLIDES.length - 1) {
        setIsAutoPlaying(false);
        return;
      }

      setActiveSlideIndex((previous) => Math.min(previous + 1, ENDING_SLIDES.length - 1));
    }, 80);

    return () => {
      window.clearInterval(timer);
    };
  }, [activeSlideIndex, isAutoPlaying]);

  useEffect(() => {
    if (activeSlide.id !== "drawings-gallery" || !isAutoPlaying || drawings.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setDrawingFrameIndex((previous) => (previous + 1) % drawings.length);
    }, DRAWING_FRAME_DURATION_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [activeSlide.id, drawings.length, isAutoPlaying]);

  useEffect(() => {
    setDrawingFrameIndex(0);
  }, [activeSlide.id]);

  const moveSlide = (nextIndex: number) => {
    const boundedIndex = Math.max(0, Math.min(nextIndex, ENDING_SLIDES.length - 1));
    setActiveSlideIndex(boundedIndex);
    setSlideProgress(0);
    setIsAutoPlaying(true);
  };

  return (
    <div className="anim-screen-in flex min-h-[100dvh] flex-col md:min-h-[852px]">
      <BrandBar />

      <div className="flex flex-1 flex-col px-5 pb-6 pt-2">
        <div className="anim-fade-up" style={reveal(40)}>
          <p className="text-xs tracking-[0.2em] text-[#ffd700]">FINAL DESTINATION REACHED</p>
          <h1 className="mt-2 font-display text-[clamp(1.95rem,8.6vw,2.35rem)] leading-none text-white">
            ENDING MEMORY CAROUSEL
          </h1>
          <p className="mt-3 max-w-[330px] text-sm leading-6 text-white/55">
            An auto-play sequence that slowly reveals every milestone your team created across the full game journey.
          </p>
        </div>

        <div className="anim-fade-up mt-4 grid grid-cols-4 gap-2" style={reveal(90)}>
          {ENDING_SLIDES.map((slide, index) => {
            const isComplete = index < activeSlideIndex;
            const isCurrent = index === activeSlideIndex;
            const fillWidth = isComplete ? "100%" : isCurrent ? `${slideProgress}%` : "0%";

            return (
              <button
                aria-label={`Jump to ${slide.stepLabel.toLowerCase()}`}
                className="h-2 overflow-hidden rounded-full bg-white/10"
                key={slide.id}
                onClick={() => moveSlide(index)}
                type="button"
              >
                <span
                  className={cn(
                    "block h-full rounded-full transition-[width] duration-200",
                    isCurrent || isComplete ? "bg-[#ff6b00]" : "bg-white/30"
                  )}
                  style={{ width: fillWidth }}
                />
              </button>
            );
          })}
        </div>

        <div className="anim-fade-up mt-4 flex-1 rounded-[20px] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]" style={reveal(120)}>
          <p className={cn("text-[0.68rem] tracking-[0.2em]", activeSlide.accentClass)}>{activeSlide.stepLabel}</p>
          <h2 className="mt-2 font-display text-[clamp(1.55rem,6.8vw,2rem)] leading-none text-white">{activeSlide.title}</h2>
          <p className="mt-3 text-sm leading-6 text-white/55">{activeSlide.description}</p>

          <div className="mt-4">
            {activeSlide.id === "first-game-memory" ? (
              <div className="relative h-[38dvh] min-h-[248px] overflow-hidden rounded-[16px] border border-[#ff6b00]/25">
                <img
                  alt="First game memory from bucket"
                  className="anim-carousel-reveal h-full w-full object-cover"
                  key={`${activeSlide.id}-${media.firstLocationImageSrc}`}
                  src={media.firstLocationImageSrc}
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_20%,rgba(0,0,0,0.72)_100%)]" />
                <p className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-[0.7rem] tracking-[0.08em] text-white/85">
                  FIRST GAME LOCATION SNAPSHOT
                </p>
              </div>
            ) : null}

            {activeSlide.id === "group-dance" ? (
              <div className="relative overflow-hidden rounded-[16px] border border-[#00d4ff]/25 bg-black">
                <video
                  autoPlay
                  className="anim-carousel-reveal aspect-video w-full object-cover"
                  controls
                  key={`${activeSlide.id}-${media.secondLocationDanceVideoSrc}`}
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  src={media.secondLocationDanceVideoSrc}
                />
                <p className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[0.7rem] tracking-[0.08em] text-white/85">
                  GROUP DANCE RECORDING
                </p>
              </div>
            ) : null}

            {activeSlide.id === "drawings-gallery" ? (
              <div className="space-y-3">
                <div className="relative h-[30dvh] min-h-[220px] overflow-hidden rounded-[16px] border border-[#ff3399]/25 bg-black">
                  {drawings.length ? (
                    <img
                      alt={`Team drawing ${safeDrawingIndex + 1}`}
                      className="anim-carousel-reveal h-full w-full object-cover"
                      key={`${activeSlide.id}-${activeDrawing.src}`}
                      src={activeDrawing.src}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-6 text-white/45">
                      Add drawing bucket image URLs to show the team gallery here.
                    </div>
                  )}
                  {drawings.length ? (
                    <>
                      <p className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[0.7rem] tracking-[0.08em] text-white/85">
                        DRAWING {safeDrawingIndex + 1} OF {drawings.length}
                      </p>
                      <p className="absolute bottom-3 right-3 rounded-full border border-[#ff3399]/40 bg-black/55 px-3 py-1 text-[0.7rem] tracking-[0.08em] text-[#ffd3ea]">
                        DRAWN BY {activeDrawing.authorName.toUpperCase()}
                      </p>
                    </>
                  ) : null}
                </div>
                {drawings.length > 1 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {drawings.slice(0, 4).map((drawing, index) => (
                      <button
                        className={cn(
                          "overflow-hidden rounded-[10px] border transition-colors",
                          index === safeDrawingIndex ? "border-[#ff3399]" : "border-white/10"
                        )}
                        key={`${drawing.src}-${drawing.authorName}`}
                        onClick={() => setDrawingFrameIndex(index)}
                        type="button"
                      >
                        <img alt="" className="h-16 w-full object-cover" src={drawing.src} />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeSlide.id === "final-song" ? (
              <div className="rounded-[16px] border border-[#ffd700]/25 bg-[linear-gradient(180deg,rgba(255,215,0,0.1),rgba(255,215,0,0.03))] p-4">
                <p className="text-[0.7rem] tracking-[0.15em] text-[#ffd700]">TEAM VOICE RECORDING</p>
                <p className="mt-2 font-display text-[clamp(1.45rem,6.2vw,1.8rem)] leading-none text-white">{media.finalSong.songTitle}</p>
                {media.finalSong.voiceContributors.length ? (
                  <p className="mt-2 text-xs leading-5 text-[#ffe9a8]">
                    Voices by {media.finalSong.voiceContributors.join(", ")}
                  </p>
                ) : null}

                <div className="mt-4 flex h-14 items-end justify-center gap-1">
                  {Array.from({ length: 22 }).map((_, index) => (
                    <span
                      className={cn(
                        "h-2 w-1 rounded-full bg-[#ffd700]/80",
                        isAutoPlaying ? "anim-audio-wave" : ""
                      )}
                      key={index}
                      style={{ animationDelay: `${index * 90}ms` }}
                    />
                  ))}
                </div>

                <audio className="mt-4 w-full" controls preload="metadata" src={media.finalSong.audioSrc} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="anim-fade-up mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2" style={reveal(170)}>
          <button
            className={cn(
              "h-11 rounded-[12px] border text-xs tracking-[0.08em] transition-colors",
              canMovePrevious
                ? "border-white/20 text-white/75 hover:border-white/40 hover:text-white"
                : "border-white/10 text-white/25"
            )}
            disabled={!canMovePrevious}
            onClick={() => moveSlide(activeSlideIndex - 1)}
            type="button"
          >
            PREVIOUS
          </button>

          <button
            className="h-11 rounded-[12px] border border-[#ff6b00]/40 px-4 text-xs tracking-[0.08em] text-[#ffb17d] transition-colors hover:border-[#ff6b00] hover:text-[#ffd5b6]"
            onClick={() => setIsAutoPlaying((current) => !current)}
            type="button"
          >
            {isAutoPlaying ? "PAUSE" : "PLAY"}
          </button>

          <button
            className={cn(
              "h-11 rounded-[12px] border text-xs tracking-[0.08em] transition-colors",
              canMoveNext
                ? "border-white/20 text-white/75 hover:border-white/40 hover:text-white"
                : "border-white/10 text-white/25"
            )}
            disabled={!canMoveNext}
            onClick={() => moveSlide(activeSlideIndex + 1)}
            type="button"
          >
            NEXT
          </button>
        </div>

        <div className="anim-fade-up mt-2" style={reveal(200)}>
          <PrimaryButton label="Back to Lobby" onClick={onBackToLobby} />
        </div>
      </div>
    </div>
  );
}
