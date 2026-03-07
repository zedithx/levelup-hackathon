"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  DEFAULT_MEMBERS,
  ORDER_REVEAL_MS,
  PHASE_TICK_MS,
  PRE_GAME_COUNTDOWN_SEC,
  SINGING_GAME_SONG
} from "@/components/singing-game/flow/constants";
import { CountdownScreen } from "@/components/singing-game/flow/screens/countdown-screen";
import { InstructionsScreen } from "@/components/singing-game/flow/screens/instructions-screen";
import { OrderScreen } from "@/components/singing-game/flow/screens/order-screen";
import { SummaryScreen } from "@/components/singing-game/flow/screens/summary-screen";
import { TurnScreen } from "@/components/singing-game/flow/screens/turn-screen";
import type { DrawingGameMember, DrawingGameScreen } from "@/components/singing-game/flow/types";
import { activeLyricIndex, buildTurns, lyricLinesForTurn } from "@/components/singing-game/flow/utils";

export function SingingGameFlow() {
  const [screen, setScreen] = useState<DrawingGameScreen>("instructions");
  const [members, setMembers] = useState<DrawingGameMember[]>(DEFAULT_MEMBERS);
  const [countdownSec, setCountdownSec] = useState(PRE_GAME_COUNTDOWN_SEC);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [phaseRemainingMs, setPhaseRemainingMs] = useState(0);

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

  const startTurnReady = useCallback(
    (turnIndex: number) => {
      const turn = turns[turnIndex];

      if (!turn) {
        setScreen("summary");
        return;
      }

      setCurrentTurnIndex(turnIndex);
      setPhaseRemainingMs(Math.round(turn.readySec * 1000));
      setScreen("turn-ready");
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
      startTurnReady(0);
    }, ORDER_REVEAL_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [screen, startTurnReady]);

  useEffect(() => {
    if (screen !== "turn-ready" && screen !== "turn-sing") {
      return;
    }

    if (phaseRemainingMs <= 0) {
      if (screen === "turn-ready") {
        startTurnSing(currentTurnIndex);
        return;
      }

      const nextTurnIndex = currentTurnIndex + 1;
      if (nextTurnIndex < turns.length) {
        startTurnReady(nextTurnIndex);
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
    startTurnReady,
    startTurnSing,
    turns.length
  ]);

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
    return <OrderScreen onStartNow={() => startTurnReady(0)} turns={turns} />;
  }

  if ((screen === "turn-ready" || screen === "turn-sing") && activeTurn) {
    return (
      <TurnScreen
        activeLyricLineIndex={activeLyricLineIndex}
        lyrics={lyricsForActiveTurn}
        mode={screen === "turn-ready" ? "ready" : "sing"}
        nextMemberName={nextMemberName}
        remainingMs={phaseRemainingMs}
        turn={activeTurn}
      />
    );
  }

  return <SummaryScreen onBackToSetup={goToSetup} onReplay={startRound} turns={turns} />;
}
