/* eslint-disable @next/next/no-img-element */

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_MEMBERS } from "@/components/drawing-game/flow/constants";
import { FlowShell, Panel, PrimaryButton, ProgressBar } from "@/components/drawing-game/flow/ui";
import { cn } from "@/components/drawing-game/flow/utils";
import { SketchCanvas, type SketchCanvasHandle } from "@/components/drawing-game/sketch-canvas";
import { saveDrawingMemoryAssets } from "@/lib/memory-assets";
import { uploadGameAsset } from "@/lib/upload-game-asset";

const SECRET_WORD_PLACEHOLDER = "Moonwalk";
const LOOK_DURATION_SEC = 5;
const DRAW_DURATION_SEC = 20;
const GUESS_DURATION_SEC = 10;

type RelayPlayer = {
  id: string;
  name: string;
  emoji: string;
};

const DEFAULT_LINEUP: RelayPlayer[] = DEFAULT_MEMBERS.map((member) => ({
  id: member.id,
  name: member.name,
  emoji: member.emoji
}));

type RelayScreen =
  | { kind: "setup" }
  | { kind: "secret-word-ready"; playerIndex: number }
  | { kind: "secret-word-draw"; playerIndex: number; endsAt: number }
  | { kind: "relay-look-ready"; playerIndex: number }
  | { kind: "relay-look"; playerIndex: number; endsAt: number }
  | { kind: "relay-draw"; playerIndex: number; endsAt: number }
  | { kind: "relay-pass"; playerIndex: number }
  | { kind: "final-guess-ready" }
  | { kind: "final-guess"; endsAt: number }
  | { kind: "reveal" };

type RelayDrawing = {
  playerIndex: number;
  imageDataUrl: string;
};

type TimerModel = {
  key: string;
  remainingMs: number;
  totalMs: number;
};

function phaseTimer(screen: RelayScreen, nowMs: number): TimerModel | null {
  switch (screen.kind) {
    case "secret-word-draw": {
      return {
        key: `secret-word-draw-${screen.playerIndex}-${screen.endsAt}`,
        remainingMs: Math.max(0, screen.endsAt - nowMs),
        totalMs: DRAW_DURATION_SEC * 1000
      };
    }
    case "relay-look": {
      return {
        key: `relay-look-${screen.playerIndex}-${screen.endsAt}`,
        remainingMs: Math.max(0, screen.endsAt - nowMs),
        totalMs: LOOK_DURATION_SEC * 1000
      };
    }
    case "relay-draw": {
      return {
        key: `relay-draw-${screen.playerIndex}-${screen.endsAt}`,
        remainingMs: Math.max(0, screen.endsAt - nowMs),
        totalMs: DRAW_DURATION_SEC * 1000
      };
    }
    case "final-guess": {
      return {
        key: `final-guess-${screen.endsAt}`,
        remainingMs: Math.max(0, screen.endsAt - nowMs),
        totalMs: GUESS_DURATION_SEC * 1000
      };
    }
    default:
      return null;
  }
}

function turnNumberFromPlayer(activePlayerCount: number, playerIndex: number) {
  return activePlayerCount - playerIndex;
}

function dataUrlToFile(dataUrl: string, fileName: string) {
  const [meta, payload] = dataUrl.split(",");

  if (!meta || !payload) {
    return null;
  }

  const mimeTypeMatch = meta.match(/^data:(.*?);base64$/);
  const mimeType = mimeTypeMatch?.[1] ?? "image/png";
  const byteCharacters = atob(payload);
  const byteNumbers = new Array(byteCharacters.length);

  for (let index = 0; index < byteCharacters.length; index += 1) {
    byteNumbers[index] = byteCharacters.charCodeAt(index);
  }

  return new File([new Uint8Array(byteNumbers)], fileName, { type: mimeType });
}

export function DrawingRelayFlow() {
  const router = useRouter();
  const [draftPlayers, setDraftPlayers] = useState<RelayPlayer[]>(() =>
    DEFAULT_LINEUP.map((player) => ({ ...player }))
  );
  const [activePlayers, setActivePlayers] = useState<RelayPlayer[]>(() =>
    DEFAULT_LINEUP.map((player) => ({ ...player }))
  );
  const [screen, setScreen] = useState<RelayScreen>({ kind: "setup" });
  const [drawings, setDrawings] = useState<RelayDrawing[]>([]);
  const [guessInput, setGuessInput] = useState("");
  const [revealedGuess, setRevealedGuess] = useState("");
  const [isUploadingDrawings, setIsUploadingDrawings] = useState(false);
  const [drawingsUploadError, setDrawingsUploadError] = useState<string | null>(null);
  const [drawingsUploadDone, setDrawingsUploadDone] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const handledTimerKeyRef = useRef<string | null>(null);
  const canvasRef = useRef<SketchCanvasHandle | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 100);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const timer = useMemo(() => phaseTimer(screen, nowMs), [screen, nowMs]);
  const activePlayerCount = activePlayers.length;
  const latestDrawing = drawings.length ? drawings[drawings.length - 1].imageDataUrl : "";

  const playerLabel = useCallback(
    (index: number) => {
      const playerName = activePlayers[index]?.name ?? `Player ${index + 1}`;

      if (index === activePlayerCount - 1) {
        return `${playerName} (Last in line)`;
      }

      if (index === 0) {
        return `${playerName} (First in line)`;
      }

      return playerName;
    },
    [activePlayerCount, activePlayers]
  );

  const commitCurrentCanvas = useCallback((playerIndex: number) => {
    const snapshot = canvasRef.current?.exportPng();

    if (!snapshot) {
      return;
    }

    setDrawings((current) => [...current, { playerIndex, imageDataUrl: snapshot }]);
  }, []);

  const moveToNextPassReceiver = useCallback((currentPlayerIndex: number) => {
    const nextDrawerIndex = currentPlayerIndex - 1;

    if (nextDrawerIndex > 0) {
      setScreen({ kind: "relay-look-ready", playerIndex: nextDrawerIndex });
      return;
    }

    setScreen({ kind: "final-guess-ready" });
  }, []);

  const finalizeGuess = useCallback(() => {
    setRevealedGuess(guessInput.trim());
    setScreen({ kind: "reveal" });
  }, [guessInput]);

  const uploadDrawingsToBucket = useCallback(async () => {
    if (!drawings.length) {
      return;
    }

    setIsUploadingDrawings(true);
    setDrawingsUploadError(null);

    try {
      const uploadedDrawings: Array<{ src: string; authorName: string }> = [];

      for (let index = 0; index < drawings.length; index += 1) {
        const drawing = drawings[index];
        const authorName = activePlayers[drawing.playerIndex]?.name || `Player ${drawing.playerIndex + 1}`;
        const drawingFile = dataUrlToFile(
          drawing.imageDataUrl,
          `drawing-${index + 1}-${authorName.replace(/\\s+/g, "-")}.png`
        );

        if (!drawingFile) {
          continue;
        }

        const uploadResult = await uploadGameAsset({
          assetType: "drawing",
          file: drawingFile,
          playerName: authorName
        });

        uploadedDrawings.push({
          authorName,
          src: uploadResult.publicUrl
        });
      }

      if (uploadedDrawings.length) {
        saveDrawingMemoryAssets(uploadedDrawings);
      }

      setDrawingsUploadDone(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload drawings.";
      setDrawingsUploadError(message);
      setDrawingsUploadDone(false);
    } finally {
      setIsUploadingDrawings(false);
    }
  }, [activePlayers, drawings]);

  useEffect(() => {
    if (
      screen.kind !== "reveal"
      || !drawings.length
      || drawingsUploadDone
      || isUploadingDrawings
      || drawingsUploadError
    ) {
      return;
    }

    void uploadDrawingsToBucket();
  }, [drawings.length, drawingsUploadDone, drawingsUploadError, isUploadingDrawings, screen.kind, uploadDrawingsToBucket]);

  useEffect(() => {
    if (!timer) {
      handledTimerKeyRef.current = null;
      return;
    }

    if (timer.remainingMs > 0) {
      handledTimerKeyRef.current = null;
      return;
    }

    if (handledTimerKeyRef.current === timer.key) {
      return;
    }

    handledTimerKeyRef.current = timer.key;

    switch (screen.kind) {
      case "secret-word-draw": {
        commitCurrentCanvas(screen.playerIndex);
        setScreen({ kind: "relay-pass", playerIndex: screen.playerIndex });
        return;
      }
      case "relay-look": {
        canvasRef.current?.clear();
        setScreen({ kind: "relay-draw", playerIndex: screen.playerIndex, endsAt: Date.now() + DRAW_DURATION_SEC * 1000 });
        return;
      }
      case "relay-draw": {
        commitCurrentCanvas(screen.playerIndex);
        setScreen({ kind: "relay-pass", playerIndex: screen.playerIndex });
        return;
      }
      case "final-guess": {
        setRevealedGuess(guessInput.trim());
        setScreen({ kind: "reveal" });
        return;
      }
      default:
        return;
    }
  }, [commitCurrentCanvas, guessInput, screen, timer]);

  const stepLabel = useMemo(() => {
    switch (screen.kind) {
      case "setup":
        return "SETUP";
      case "secret-word-ready":
      case "secret-word-draw":
        return "DRAW 1";
      case "relay-look-ready":
      case "relay-look":
      case "relay-draw":
      case "relay-pass": {
        return `DRAW ${turnNumberFromPlayer(activePlayerCount, screen.playerIndex)}`;
      }
      case "final-guess-ready":
      case "final-guess":
        return "FINAL GUESS";
      case "reveal":
        return "REVEAL";
      default:
        return "DRAWING RELAY";
    }
  }, [activePlayerCount, screen]);

  const updateDraftPlayerName = (playerId: string, value: string) => {
    setDraftPlayers((currentPlayers) =>
      currentPlayers.map((player) => {
        if (player.id !== playerId) {
          return player;
        }

        return {
          ...player,
          name: value.slice(0, 24)
        };
      })
    );
  };

  const moveDraftPlayer = (fromIndex: number, toIndex: number) => {
    setDraftPlayers((currentPlayers) => {
      if (toIndex < 0 || toIndex >= currentPlayers.length) {
        return currentPlayers;
      }

      const nextPlayers = [...currentPlayers];
      const [moved] = nextPlayers.splice(fromIndex, 1);
      nextPlayers.splice(toIndex, 0, moved);
      return nextPlayers;
    });
  };

  const startGame = () => {
    const preparedPlayers = draftPlayers.map((player, index) => ({
      ...player,
      name: player.name.trim() || `Player ${index + 1}`
    }));

    setDraftPlayers(preparedPlayers);
    setActivePlayers(preparedPlayers);
    setDrawings([]);
    setGuessInput("");
    setRevealedGuess("");
    setIsUploadingDrawings(false);
    setDrawingsUploadError(null);
    setDrawingsUploadDone(false);
    setScreen({ kind: "secret-word-ready", playerIndex: preparedPlayers.length - 1 });
  };

  const beginSecretWordDraw = (playerIndex: number) => {
    canvasRef.current?.clear();
    setScreen({ kind: "secret-word-draw", playerIndex, endsAt: Date.now() + DRAW_DURATION_SEC * 1000 });
  };

  const beginRelayLook = (playerIndex: number) => {
    setScreen({ kind: "relay-look", playerIndex, endsAt: Date.now() + LOOK_DURATION_SEC * 1000 });
  };

  const beginFinalGuess = () => {
    setGuessInput("");
    setScreen({ kind: "final-guess", endsAt: Date.now() + GUESS_DURATION_SEC * 1000 });
  };

  const secondsLeft = timer ? Math.max(0, Math.ceil(timer.remainingMs / 1000)) : 0;
  const progress = timer ? (timer.totalMs - timer.remainingMs) / timer.totalMs : 0;
  const urgent = secondsLeft <= 3;
  const lookImageFadingOut = screen.kind === "relay-look" && timer ? timer.remainingMs <= 700 : false;

  return (
    <FlowShell stepLabel={stepLabel}>
      {screen.kind === "setup" ? (
        <div className="anim-screen-in flex h-full min-h-0 flex-1 flex-col">
          <div className="anim-fade-up text-center" style={{ animationDelay: "70ms" }}>
            <p className="text-xs tracking-[0.28em] text-[#00d4ff]">PARTY MODE</p>
            <h1 className="mt-3 font-display text-[clamp(2.2rem,10vw,2.8rem)] leading-none tracking-[0.03em] text-white">
              DRAWING RELAY
            </h1>
            <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-white/55">
              Fast memory, fast hands. Pass one phone forward and see how wild the final guess gets.
            </p>
          </div>

          <Panel className="anim-fade-up mt-5 border-[#ff6b00]/25 bg-[rgba(255,107,0,0.08)]" style={{ animationDelay: "150ms" }}>
            <p className="text-xs tracking-[0.16em] text-[#ff6b00]">SETUP</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-white/70">
              <li>1. Line up, standing or sitting, all facing forward.</li>
              <li>2. Last person in line starts with the phone.</li>
              <li>3. Everyone except the current drawer must not peek.</li>
            </ul>
          </Panel>

          <Panel className="anim-fade-up mt-4 min-h-0 overflow-hidden" style={{ animationDelay: "220ms" }}>
            <p className="text-xs tracking-[0.12em] text-white/35">LINE ORDER (FRONT TO BACK)</p>
            <p className="mt-2 text-xs leading-5 text-white/45">
              Top player is at the front and makes the final guess. Bottom player starts drawing first.
            </p>
            <div className="mt-2 flex items-center gap-2 text-[0.68rem] tracking-[0.1em] text-[#00d4ff]">
              <span className="rounded-full border border-[#00d4ff]/35 bg-[rgba(0,212,255,0.12)] px-2 py-0.5">↕ SCROLL</span>
              <span>Swipe up/down to see full line order</span>
            </div>
            <div className="relative mt-2">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-5 bg-gradient-to-b from-[#171717] to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-7 bg-gradient-to-t from-[#171717] to-transparent" />
              <div className="pointer-events-none absolute bottom-1 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/15 bg-[#101010]/85 px-2.5 py-1 text-[0.62rem] tracking-[0.1em] text-white/60">
                SCROLL FOR MORE
              </div>
              <div className="max-h-[clamp(12rem,34vh,18rem)] space-y-2 overflow-y-auto pb-8 pr-1 pt-1">
                {draftPlayers.map((player, index) => (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5" key={player.id}>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#111] text-lg">
                        {player.emoji}
                      </span>
                      <input
                        className="h-9 min-w-0 flex-1 rounded-lg border border-white/10 bg-[#111] px-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#ff6b00] focus:outline-none"
                        maxLength={24}
                        onChange={(event) => updateDraftPlayerName(player.id, event.target.value)}
                        placeholder={`Player ${index + 1}`}
                        value={player.name}
                      />
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm font-bold text-white/70 transition-colors hover:border-[#ff6b00]/40 hover:text-white disabled:text-white/20"
                          disabled={index === 0}
                          onClick={() => moveDraftPlayer(index, index - 1)}
                          type="button"
                        >
                          ↑
                        </button>
                        <button
                          className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm font-bold text-white/70 transition-colors hover:border-[#ff6b00]/40 hover:text-white disabled:text-white/20"
                          disabled={index === draftPlayers.length - 1}
                          onClick={() => moveDraftPlayer(index, index + 1)}
                          type="button"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                    <p className="mt-1.5 text-[0.68rem] tracking-[0.08em] text-white/30">
                      {index === 0 ? "FRONT OF LINE" : index === draftPlayers.length - 1 ? "BACK OF LINE" : "MIDDLE"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-white/35">
              Secret word placeholder for this mode: <span className="text-white/70">{SECRET_WORD_PLACEHOLDER}</span>
            </p>
          </Panel>

          <div className="anim-fade-up mt-auto" style={{ animationDelay: "300ms" }}>
            <PrimaryButton label="Start game" onClick={startGame} />
          </div>
        </div>
      ) : null}

      {screen.kind === "secret-word-ready" ? (
        <div className="anim-screen-in flex h-full flex-1 flex-col">
          <Panel className="border-[#ffd700]/40 bg-[rgba(255,215,0,0.09)] text-center">
            <p className="text-xs tracking-[0.18em] text-[#ffd700]">CURRENT DRAWER</p>
            <h2 className="mt-2 font-display text-[clamp(1.8rem,8.5vw,2.2rem)] leading-none text-white">
              {playerLabel(screen.playerIndex)}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/65">Only this player should look at the screen now.</p>
          </Panel>

          <Panel className="mt-4 text-center">
            <p className="text-sm leading-6 text-white/60">
              Reveal the secret word, then draw it from memory in <span className="text-white">20 seconds</span>.
            </p>
          </Panel>

          <div className="mt-auto space-y-2">
            <PrimaryButton label="Reveal word" onClick={() => beginSecretWordDraw(screen.playerIndex)} />
            <p className="text-center text-xs text-white/25">Everyone else: eyes forward.</p>
          </div>
        </div>
      ) : null}

      {screen.kind === "secret-word-draw" ? (
        <div className="anim-screen-in flex h-full flex-1 flex-col">
          <Panel className="border-[#00d4ff]/40 bg-[rgba(0,212,255,0.08)]">
            <p className="text-xs tracking-[0.16em] text-[#00d4ff]">YOUR SECRET WORD</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="font-display text-[clamp(2rem,9.8vw,2.7rem)] leading-none text-white">{SECRET_WORD_PLACEHOLDER}</p>
              <span className="rounded-full border border-[#00d4ff]/30 bg-[rgba(0,212,255,0.15)] px-3 py-1 text-xs font-bold text-[#00d4ff]">
                🖍 DRAW IT
              </span>
            </div>
          </Panel>

          <TimerPanel progress={progress} secondsLeft={secondsLeft} urgent={urgent} />

          <div className="mt-3">
            <SketchCanvas ref={canvasRef} />
          </div>

          <p className="mt-3 text-center text-xs text-white/30">No peeking. Keep the word private from the rest of the line.</p>
        </div>
      ) : null}

      {screen.kind === "relay-pass" ? (
        <div className="anim-screen-in flex h-full flex-1 flex-col">
          <Panel className="border-[#ff6b00]/30 bg-[rgba(255,107,0,0.1)] text-center">
            <p className="text-xs tracking-[0.18em] text-[#ff6b00]">TIME UP</p>
            <h2 className="mt-2 font-display text-[clamp(1.8rem,8.2vw,2.2rem)] leading-none text-white">
              Pass the phone to the person in front of you
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/65">
              {screen.playerIndex - 1 > 0
                ? `${playerLabel(screen.playerIndex - 1)} will look for 5 seconds, then redraw for 20 seconds.`
                : "Front player will make the final guess from the last drawing."}
            </p>
          </Panel>

          <div className="mt-auto space-y-2">
            <PrimaryButton label="Pass forward" onClick={() => moveToNextPassReceiver(screen.playerIndex)} />
            <p className="text-center text-xs text-white/25">Everyone except the new holder should keep facing forward.</p>
          </div>
        </div>
      ) : null}

      {screen.kind === "relay-look-ready" ? (
        <div className="anim-screen-in flex h-full flex-1 flex-col">
          <Panel className="border-[#00d4ff]/35 bg-[rgba(0,212,255,0.08)] text-center">
            <p className="text-xs tracking-[0.16em] text-[#00d4ff]">CURRENT DRAWER</p>
            <h2 className="mt-2 font-display text-[clamp(1.9rem,8.6vw,2.3rem)] leading-none text-white">
              {playerLabel(screen.playerIndex)}
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/70">
              Drawing stays hidden until you tap start. Then you have exactly 5 seconds to look.
            </p>
          </Panel>

          <div className="mt-auto">
            <PrimaryButton label="Start 5-second look" onClick={() => beginRelayLook(screen.playerIndex)} />
          </div>
        </div>
      ) : null}

      {screen.kind === "relay-look" ? (
        <div className="anim-screen-in flex h-full flex-1 flex-col">
          <Panel className="border-[#00d4ff]/35 bg-[rgba(0,212,255,0.08)] text-center">
            <p className="text-xs tracking-[0.16em] text-[#00d4ff]">LOOK AT THIS DRAWING FOR 5 SECONDS</p>
            <p className="mt-2 text-sm text-white/65">Memorize the key shapes. A blank canvas is next.</p>
          </Panel>

          <TimerPanel progress={progress} secondsLeft={secondsLeft} urgent={urgent} />

          <DrawingPreviewCard
            className={cn("mt-3 transition-opacity duration-500", lookImageFadingOut ? "opacity-0" : "opacity-100")}
            imageDataUrl={latestDrawing}
            label="Snapshot from previous player"
          />
        </div>
      ) : null}

      {screen.kind === "relay-draw" ? (
        <div className="anim-screen-in flex h-full flex-1 flex-col">
          <Panel className="border-[#ff3399]/35 bg-[rgba(255,51,153,0.09)]">
            <p className="text-xs tracking-[0.16em] text-[#ff3399]">{playerLabel(screen.playerIndex)}</p>
            <p className="mt-2 text-sm text-white/65">Redraw what you remember. Keep it quick and clear.</p>
          </Panel>

          <TimerPanel progress={progress} secondsLeft={secondsLeft} urgent={urgent} />

          <div className="mt-3">
            <SketchCanvas ref={canvasRef} />
          </div>
        </div>
      ) : null}

      {screen.kind === "final-guess-ready" ? (
        <div className="anim-screen-in flex h-full flex-1 flex-col">
          <Panel className="border-[#ffd700]/35 bg-[rgba(255,215,0,0.09)] text-center">
            <p className="text-xs tracking-[0.16em] text-[#ffd700]">FINAL GUESSER</p>
            <h2 className="mt-2 font-display text-[clamp(2rem,9vw,2.4rem)] leading-none text-white">{playerLabel(0)}</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">You only get the last drawing. Guess the original secret word.</p>
          </Panel>

          <DrawingPreviewCard className="mt-4" imageDataUrl={latestDrawing} label="Last drawing only" />

          <div className="mt-auto">
            <PrimaryButton label="Start final guess" onClick={beginFinalGuess} />
          </div>
        </div>
      ) : null}

      {screen.kind === "final-guess" ? (
        <div className="anim-screen-in flex h-full flex-1 flex-col">
          <DrawingPreviewCard imageDataUrl={latestDrawing} label="Your clue" />

          <TimerPanel progress={progress} secondsLeft={secondsLeft} urgent={urgent} />

          <label className="mt-3 text-xs tracking-[0.12em] text-white/35" htmlFor="relay-guess-input">
            YOUR GUESS OF THE WORD
          </label>
          <textarea
            className="mt-2 h-28 w-full resize-none rounded-2xl border border-white/15 bg-[#161616] px-4 py-3 text-base text-white placeholder:text-white/35 focus:border-[#ffd700] focus:outline-none"
            id="relay-guess-input"
            maxLength={48}
            onChange={(event) => setGuessInput(event.target.value)}
            placeholder="Type your guess..."
            value={guessInput}
          />

          <div className="mt-3">
            <PrimaryButton label="Confirm guess" onClick={finalizeGuess} />
          </div>
        </div>
      ) : null}

      {screen.kind === "reveal" ? (
        <div className="anim-screen-in flex h-full flex-1 flex-col">
          <Panel className="border-[#00d4ff]/35 bg-[rgba(0,212,255,0.08)]">
            <p className="text-xs tracking-[0.16em] text-[#00d4ff]">STEP 1: REVEAL</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-[#101010] p-3">
                <p className="text-[0.68rem] tracking-[0.12em] text-white/35">ORIGINAL WORD</p>
                <p className="mt-2 font-display text-3xl leading-none text-white">{SECRET_WORD_PLACEHOLDER}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#101010] p-3">
                <p className="text-[0.68rem] tracking-[0.12em] text-white/35">FINAL GUESS</p>
                <p className="mt-2 font-display text-3xl leading-none text-white">{revealedGuess || "No guess"}</p>
              </div>
            </div>
          </Panel>

          <Panel className="mt-4 flex min-h-0 flex-1 flex-col">
            <p className="text-xs tracking-[0.16em] text-[#ff3399]">STEP 2: DRAWING TIMELINE</p>
            <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {drawings.map((drawing, index) => (
                <div className="rounded-xl border border-white/10 bg-[#111] p-3" key={`${drawing.playerIndex}-${index}`}>
                  <p className="text-[0.68rem] tracking-[0.12em] text-white/35">TURN {index + 1}</p>
                  <p className="mb-2 text-sm text-white/70">{playerLabel(drawing.playerIndex)}</p>
                  <img
                    alt={`Drawing turn ${index + 1}`}
                    className="h-32 w-full rounded-lg border border-white/10 bg-white object-contain"
                    src={drawing.imageDataUrl}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3">
              {isUploadingDrawings ? (
                <p className="text-xs text-[#ffd8b2]">Uploading team drawings to bucket...</p>
              ) : null}
              {drawingsUploadDone ? (
                <p className="text-xs text-[#98ffd9]">Team drawings uploaded. Memory carousel now uses these images.</p>
              ) : null}
              {drawingsUploadError ? (
                <p className="text-xs text-[#ffaaaa]">Drawing upload failed: {drawingsUploadError}</p>
              ) : null}
              {drawingsUploadError ? (
                <button
                  className="mt-2 h-9 rounded-lg border border-white/15 px-3 text-xs text-white/75 transition-colors hover:border-white/30 hover:text-white"
                  onClick={() => void uploadDrawingsToBucket()}
                  type="button"
                >
                  Retry upload
                </button>
              ) : null}
            </div>
          </Panel>

          <div className="mt-4">
            <PrimaryButton label="Continue to AR" onClick={() => router.push("/ar-experience")} />
          </div>
        </div>
      ) : null}
    </FlowShell>
  );
}

type TimerPanelProps = {
  progress: number;
  secondsLeft: number;
  urgent: boolean;
};

function TimerPanel({ progress, secondsLeft, urgent }: TimerPanelProps) {
  return (
    <Panel className="mt-3 border-white/15 bg-[#151515]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.68rem] tracking-[0.14em] text-white/35">TIMER</p>
          <p className={cn("font-display text-4xl leading-none", urgent ? "text-[#ff3399]" : "text-white")}>
            {secondsLeft}
          </p>
        </div>
        <div
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-bold tracking-[0.08em]",
            urgent ? "border-[#ff3399]/45 bg-[rgba(255,51,153,0.15)] text-[#ff3399]" : "border-[#ff6b00]/35 bg-[rgba(255,107,0,0.12)] text-[#ff6b00]"
          )}
        >
          {urgent ? "HURRY" : "LIVE"}
        </div>
      </div>
      <div className="mt-3">
        <ProgressBar accent={urgent ? "#ff3399" : "#ff6b00"} progress={progress} />
      </div>
    </Panel>
  );
}

type DrawingPreviewCardProps = {
  imageDataUrl: string;
  label: string;
  className?: string;
};

function DrawingPreviewCard({ imageDataUrl, label, className }: DrawingPreviewCardProps) {
  return (
    <Panel className={cn("border-white/10 bg-[#151515]", className)}>
      <p className="text-[0.68rem] tracking-[0.12em] text-white/35">{label.toUpperCase()}</p>
      <img
        alt={label}
        className="mt-2 h-52 w-full rounded-xl border border-white/10 bg-white object-contain"
        src={imageDataUrl}
      />
    </Panel>
  );
}
