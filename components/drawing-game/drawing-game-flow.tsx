"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  DEFAULT_MEMBERS,
  DRAWING_GAME_SONG,
  MAX_MEMBERS,
  MEMBER_EMOJI_POOL,
  MIN_MEMBERS,
  ORDER_REVEAL_MS,
  PHASE_TICK_MS,
  PRE_GAME_COUNTDOWN_SEC
} from "@/components/drawing-game/flow/constants";
import { CountdownScreen } from "@/components/drawing-game/flow/screens/countdown-screen";
import { InstructionsScreen } from "@/components/drawing-game/flow/screens/instructions-screen";
import { OrderScreen } from "@/components/drawing-game/flow/screens/order-screen";
import { SummaryScreen } from "@/components/drawing-game/flow/screens/summary-screen";
import { TurnScreen } from "@/components/drawing-game/flow/screens/turn-screen";
import type { DrawingGameMember, DrawingGameScreen } from "@/components/drawing-game/flow/types";
import { activeLyricIndex, buildTurns, lyricLinesForTurn } from "@/components/drawing-game/flow/utils";

const ACCENT_POOL = ["#ff6b00", "#00d4ff", "#ff3399", "#ffd700", "#ff8a3d", "#7dd3fc"];

export function DrawingGameFlow() {
  const [screen, setScreen] = useState<DrawingGameScreen>("instructions");
  const [members, setMembers] = useState<DrawingGameMember[]>(DEFAULT_MEMBERS);
  const [countdownSec, setCountdownSec] = useState(PRE_GAME_COUNTDOWN_SEC);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [phaseRemainingMs, setPhaseRemainingMs] = useState(0);

  const turns = useMemo(() => buildTurns(members, DRAWING_GAME_SONG), [members]);
  const activeTurn = turns[currentTurnIndex] ?? null;

  const lyricsForActiveTurn = useMemo(() => {
    if (!activeTurn) {
      return [];
    }

    return lyricLinesForTurn(DRAWING_GAME_SONG.lyrics, activeTurn);
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

  const resetRuntimeState = useCallback(() => {
    setCountdownSec(PRE_GAME_COUNTDOWN_SEC);
    setCurrentTurnIndex(0);
    setPhaseRemainingMs(0);
  }, []);

  const startRound = useCallback(() => {
    resetRuntimeState();
    setScreen("countdown");
  }, [resetRuntimeState]);

  const goToSetup = useCallback(() => {
    resetRuntimeState();
    setScreen("instructions");
  }, [resetRuntimeState]);

  const startTurnPreview = useCallback(
    (turnIndex: number) => {
      const turn = turns[turnIndex];

      if (!turn) {
        setScreen("summary");
        return;
      }

      setCurrentTurnIndex(turnIndex);
      setPhaseRemainingMs(Math.round(turn.previewSec * 1000));
      setScreen("turn-preview");
    },
    [turns]
  );

  const startTurnSing = useCallback(
    (turnIndex: number) => {
      const turn = turns[turnIndex];

      if (!turn) {
        setScreen("summary");
        return;
      }

      setCurrentTurnIndex(turnIndex);
      setPhaseRemainingMs(Math.round(turn.durationSec * 1000));
      setScreen("turn-sing");
    },
    [turns]
  );

  const addMember = useCallback(() => {
    setMembers((currentMembers) => {
      if (currentMembers.length >= MAX_MEMBERS) {
        return currentMembers;
      }

      const nextIndex = currentMembers.length;
      const emoji = MEMBER_EMOJI_POOL[nextIndex % MEMBER_EMOJI_POOL.length];
      const accent = ACCENT_POOL[nextIndex % ACCENT_POOL.length];

      return [
        ...currentMembers,
        {
          id: `member-${nextIndex + 1}`,
          name: `Member ${nextIndex + 1}`,
          emoji,
          accent
        }
      ];
    });
  }, []);

  const removeMember = useCallback(() => {
    setMembers((currentMembers) => {
      if (currentMembers.length <= MIN_MEMBERS) {
        return currentMembers;
      }

      return currentMembers.slice(0, -1);
    });
  }, []);

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
      startTurnPreview(0);
    }, ORDER_REVEAL_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [screen, startTurnPreview]);

  useEffect(() => {
    if (screen !== "turn-preview" && screen !== "turn-sing") {
      return;
    }

    if (phaseRemainingMs <= 0) {
      if (screen === "turn-preview") {
        startTurnSing(currentTurnIndex);
        return;
      }

      const nextTurnIndex = currentTurnIndex + 1;
      if (nextTurnIndex < turns.length) {
        startTurnPreview(nextTurnIndex);
      } else {
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
    startTurnPreview,
    startTurnSing,
    turns.length
  ]);

  if (screen === "instructions") {
    return (
      <InstructionsScreen
        canAddMember={members.length < MAX_MEMBERS}
        canRemoveMember={members.length > MIN_MEMBERS}
        members={members}
        onAddMember={addMember}
        onMemberNameChange={updateMemberName}
        onRemoveMember={removeMember}
        onStartRound={startRound}
        song={DRAWING_GAME_SONG}
        turns={turns}
      />
    );
  }

  if (screen === "countdown") {
    return <CountdownScreen countdown={countdownSec} />;
  }

  if (screen === "order") {
    return <OrderScreen onStartNow={() => startTurnPreview(0)} turns={turns} />;
  }

  if ((screen === "turn-preview" || screen === "turn-sing") && activeTurn) {
    return (
      <TurnScreen
        activeLyricLineIndex={activeLyricLineIndex}
        lyrics={lyricsForActiveTurn}
        mode={screen === "turn-preview" ? "preview" : "sing"}
        nextMemberName={nextMemberName}
        remainingMs={phaseRemainingMs}
        turn={activeTurn}
      />
    );
  }

  return <SummaryScreen onBackToSetup={goToSetup} onReplay={startRound} turns={turns} />;
}
