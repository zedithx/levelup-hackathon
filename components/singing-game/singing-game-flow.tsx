"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_MEMBERS,
  ORDER_REVEAL_MS,
  PHASE_TICK_MS,
  PRE_GAME_COUNTDOWN_SEC,
  SINGING_GAME_SONG,
  SINGING_GAME_TRACK_SRC
} from "@/components/singing-game/flow/constants";
import { CountdownScreen } from "@/components/singing-game/flow/screens/countdown-screen";
import { InstructionsScreen } from "@/components/singing-game/flow/screens/instructions-screen";
import { ListenScreen } from "@/components/singing-game/flow/screens/listen-screen";
import { OrderScreen } from "@/components/singing-game/flow/screens/order-screen";
import { SummaryScreen } from "@/components/singing-game/flow/screens/summary-screen";
import { TurnScreen } from "@/components/singing-game/flow/screens/turn-screen";
import type { DrawingGameMember, DrawingGameScreen } from "@/components/singing-game/flow/types";
import { activeLyricIndex, buildTurns, lyricLinesForTurn } from "@/components/singing-game/flow/utils";
import { saveFinalSongMemoryAsset } from "@/lib/memory-assets";
import { uploadGameAsset } from "@/lib/upload-game-asset";

function supportedAudioRecorderOptions() {
  if (typeof MediaRecorder === "undefined") {
    return undefined;
  }

  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"];
  const mimeType = candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));

  return mimeType ? { mimeType } : undefined;
}

function extensionFromAudioType(mimeType: string) {
  if (mimeType.includes("mpeg")) {
    return "mp3";
  }

  if (mimeType.includes("mp4")) {
    return "m4a";
  }

  if (mimeType.includes("wav")) {
    return "wav";
  }

  return "webm";
}

export function SingingGameFlow() {
  const router = useRouter();
  const [screen, setScreen] = useState<DrawingGameScreen>("instructions");
  const [members, setMembers] = useState<DrawingGameMember[]>(DEFAULT_MEMBERS);
  const [countdownSec, setCountdownSec] = useState(PRE_GAME_COUNTDOWN_SEC);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [phaseRemainingMs, setPhaseRemainingMs] = useState(0);
  const [roundAudioFile, setRoundAudioFile] = useState<File | null>(null);
  const [roundAudioPreviewUrl, setRoundAudioPreviewUrl] = useState<string | null>(null);
  const [isCapturingAudio, setIsCapturingAudio] = useState(false);
  const [isAudioUploading, setIsAudioUploading] = useState(false);
  const [isAudioUploaded, setIsAudioUploaded] = useState(false);
  const [hasAttemptedAudioUpload, setHasAttemptedAudioUpload] = useState(false);
  const [audioUploadError, setAudioUploadError] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [hasCompletedGuideListen, setHasCompletedGuideListen] = useState(false);

  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const turns = useMemo(
    () => buildTurns(members, SINGING_GAME_SONG).filter((turn) => turn.durationSec > 0),
    [members]
  );
  const activeTurn = turns[currentTurnIndex] ?? null;

  const lyricsForActiveTurn = useMemo(() => {
    if (!activeTurn) {
      return [];
    }

    return lyricLinesForTurn(SINGING_GAME_SONG.lyrics, activeTurn);
  }, [activeTurn]);

  const activeTurnAbsoluteSec = useMemo(() => {
    if (!activeTurn) {
      return 0;
    }

    if (screen !== "turn-sing") {
      return activeTurn.startSec;
    }

    return activeTurn.startSec + Math.max(0, activeTurn.durationSec - phaseRemainingMs / 1000);
  }, [activeTurn, phaseRemainingMs, screen]);

  const activeLyricLineIndex = useMemo(
    () => activeLyricIndex(lyricsForActiveTurn, activeTurnAbsoluteSec),
    [activeTurnAbsoluteSec, lyricsForActiveTurn]
  );

  const nextMemberName = useMemo(() => {
    const nextTurn = turns[currentTurnIndex + 1];
    return nextTurn ? nextTurn.member.name : null;
  }, [currentTurnIndex, turns]);

  const stopAudioStream = useCallback(() => {
    if (!audioStreamRef.current) {
      return;
    }

    audioStreamRef.current.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
  }, []);

  const stopRoundAudioCapture = useCallback(() => {
    const recorder = audioRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      stopAudioStream();
    }

    setIsCapturingAudio(false);
  }, [stopAudioStream]);

  const startRoundAudioCapture = useCallback(async () => {
    if (typeof MediaRecorder === "undefined") {
      setRecordingError("This browser does not support audio recording.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordingError("Microphone capture is not supported on this device.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const recorder = new MediaRecorder(stream, supportedAudioRecorderOptions());

      audioStreamRef.current = stream;
      audioRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setRecordingError("Audio recording failed during the singing round.");
        setIsCapturingAudio(false);
        stopAudioStream();
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || audioChunksRef.current[0]?.type || "audio/webm";

        if (!audioChunksRef.current.length) {
          setRecordingError("No team audio was captured. Please try another round.");
          stopAudioStream();
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const extension = extensionFromAudioType(mimeType);
        const audioFile = new File([audioBlob], `singing-round-${Date.now()}.${extension}`, {
          type: mimeType
        });

        setRoundAudioFile(audioFile);
        audioChunksRef.current = [];
        stopAudioStream();
      };

      recorder.start(250);
      setRecordingError(null);
      setIsCapturingAudio(true);
    } catch {
      setRecordingError("Microphone permission is required to capture the team singing memory.");
    }
  }, [stopAudioStream]);

  const resetRuntimeState = useCallback(() => {
    setCountdownSec(PRE_GAME_COUNTDOWN_SEC);
    setCurrentTurnIndex(0);
    setPhaseRemainingMs(0);
    setHasCompletedGuideListen(false);
  }, []);

  const resetAudioUploadState = useCallback(() => {
    setRoundAudioFile(null);
    setIsAudioUploading(false);
    setIsAudioUploaded(false);
    setHasAttemptedAudioUpload(false);
    setAudioUploadError(null);
    setRecordingError(null);
  }, []);

  const startRound = useCallback(() => {
    stopRoundAudioCapture();
    resetRuntimeState();
    resetAudioUploadState();
    setScreen("countdown");
  }, [resetAudioUploadState, resetRuntimeState, stopRoundAudioCapture]);

  const goToSetup = useCallback(() => {
    stopRoundAudioCapture();
    resetRuntimeState();
    resetAudioUploadState();
    setScreen("instructions");
  }, [resetAudioUploadState, resetRuntimeState, stopRoundAudioCapture]);

  const startTurnSing = useCallback(
    (turnIndex: number) => {
      const turn = turns[turnIndex];

      if (!turn) {
        stopRoundAudioCapture();
        setScreen("summary");
        return;
      }

      setCurrentTurnIndex(turnIndex);
      setPhaseRemainingMs(Math.round(turn.durationSec * 1000));
      setScreen("turn-sing");
    },
    [stopRoundAudioCapture, turns]
  );

  const beginSingingRound = useCallback(async () => {
    if (!hasCompletedGuideListen) {
      return;
    }

    await startRoundAudioCapture();
    startTurnSing(0);
  }, [hasCompletedGuideListen, startRoundAudioCapture, startTurnSing]);

  const uploadRoundAudio = useCallback(async () => {
    if (!roundAudioFile) {
      return;
    }

    setIsAudioUploading(true);
    setAudioUploadError(null);

    try {
      const uploadResult = await uploadGameAsset({
        assetType: "singing",
        file: roundAudioFile
      });
      const voiceContributors = members
        .map((member) => member.name.trim())
        .filter(Boolean);

      saveFinalSongMemoryAsset({
        audioSrc: uploadResult.publicUrl,
        songTitle: SINGING_GAME_SONG.title,
        voiceContributors,
        backgroundTrackSrc: SINGING_GAME_TRACK_SRC
      });

      setIsAudioUploaded(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload singing audio.";
      setAudioUploadError(message);
      setIsAudioUploaded(false);
    } finally {
      setIsAudioUploading(false);
    }
  }, [members, roundAudioFile]);

  const updateMemberName = useCallback((memberId: string, value: string) => {
    setMembers((currentMembers) =>
      currentMembers.map((member) => {
        if (member.id !== memberId) {
          return member;
        }

        const nextName = value.slice(0, 20);

        return {
          ...member,
          name: nextName
        };
      })
    );
  }, []);

  const moveMember = useCallback((memberId: string, direction: "up" | "down") => {
    setMembers((currentMembers) => {
      const sourceIndex = currentMembers.findIndex((member) => member.id === memberId);

      if (sourceIndex < 0) {
        return currentMembers;
      }

      const targetIndex = direction === "up" ? sourceIndex - 1 : sourceIndex + 1;

      if (targetIndex < 0 || targetIndex >= currentMembers.length) {
        return currentMembers;
      }

      const nextMembers = [...currentMembers];
      const [movedMember] = nextMembers.splice(sourceIndex, 1);
      nextMembers.splice(targetIndex, 0, movedMember);

      return nextMembers;
    });
  }, []);

  useEffect(() => {
    if (!roundAudioFile) {
      setRoundAudioPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(roundAudioFile);
    setRoundAudioPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [roundAudioFile]);

  useEffect(() => {
    if (screen !== "countdown") {
      return;
    }

    if (countdownSec <= 0) {
      setScreen("order");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCountdownSec((currentValue) => Math.max(currentValue - 1, 0));
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [countdownSec, screen]);

  useEffect(() => {
    if (screen !== "order") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setScreen("listen");
    }, ORDER_REVEAL_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [screen]);

  useEffect(() => {
    if (screen !== "turn-sing") {
      return;
    }

    if (phaseRemainingMs <= 0) {
      const nextTurnIndex = currentTurnIndex + 1;
      if (nextTurnIndex < turns.length) {
        startTurnSing(nextTurnIndex);
      } else {
        stopRoundAudioCapture();
        setScreen("summary");
      }
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPhaseRemainingMs((currentMs) => Math.max(currentMs - PHASE_TICK_MS, 0));
    }, PHASE_TICK_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    currentTurnIndex,
    phaseRemainingMs,
    screen,
    startTurnSing,
    stopRoundAudioCapture,
    turns.length
  ]);

  useEffect(() => {
    if (
      screen !== "summary"
      || !roundAudioFile
      || isAudioUploaded
      || isAudioUploading
      || hasAttemptedAudioUpload
    ) {
      return;
    }

    setHasAttemptedAudioUpload(true);
    void uploadRoundAudio();
  }, [hasAttemptedAudioUpload, isAudioUploaded, isAudioUploading, roundAudioFile, screen, uploadRoundAudio]);

  useEffect(() => {
    return () => {
      stopRoundAudioCapture();
    };
  }, [stopRoundAudioCapture]);

  if (screen === "instructions") {
    return (
      <InstructionsScreen
        members={members}
        onMemberNameChange={updateMemberName}
        onMoveMember={moveMember}
        onStartRound={startRound}
        song={SINGING_GAME_SONG}
        turns={turns}
      />
    );
  }

  if (screen === "countdown") {
    return <CountdownScreen countdown={countdownSec} />;
  }

  if (screen === "order") {
    return <OrderScreen onStartNow={() => setScreen("listen")} turns={turns} />;
  }

  if (screen === "listen") {
    return (
      <ListenScreen
        hasCompletedListen={hasCompletedGuideListen}
        onReadyToSing={() => {
          void beginSingingRound();
        }}
        onTrackEnded={() => setHasCompletedGuideListen(true)}
        trackArtist={SINGING_GAME_SONG.artist}
        trackSrc={SINGING_GAME_TRACK_SRC}
        trackTitle={SINGING_GAME_SONG.title}
      />
    );
  }

  if (screen === "turn-sing" && activeTurn) {
    return (
      <TurnScreen
        activeLyricLineIndex={activeLyricLineIndex}
        lyrics={lyricsForActiveTurn}
        nextMemberName={nextMemberName}
        remainingMs={phaseRemainingMs}
        turn={activeTurn}
      />
    );
  }

  return (
    <SummaryScreen
      audioPreviewUrl={roundAudioPreviewUrl}
      audioUploadError={audioUploadError}
      isAudioUploaded={isAudioUploaded}
      isAudioUploading={isAudioUploading}
      onBackToSetup={goToSetup}
      onContinueToAr={() => router.push("/ar-experience")}
      onRetryAudioUpload={() => {
        setHasAttemptedAudioUpload(true);
        void uploadRoundAudio();
      }}
      recordingError={isCapturingAudio ? null : recordingError}
      turns={turns}
    />
  );
}
