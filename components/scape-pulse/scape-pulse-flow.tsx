"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  ENDING_CAROUSEL_DEFAULT_MEDIA,
  ONBOARDING_SLIDES,
  RACE_FLOW_CONFIG
} from "@/components/scape-pulse/flow/constants";
import { CameraPermissionScreen } from "@/components/scape-pulse/flow/screens/camera-permission-screen";
import { CheckpointClearedScreen } from "@/components/scape-pulse/flow/screens/checkpoint-cleared-screen";
import { ClassCodeScreen } from "@/components/scape-pulse/flow/screens/class-code-screen";
import { FinalDestinationCarouselScreen } from "@/components/scape-pulse/flow/screens/final-destination-carousel-screen";
import { HandoffScreen } from "@/components/scape-pulse/flow/screens/handoff-screen";
import { LobbyScreen } from "@/components/scape-pulse/flow/screens/lobby-screen";
import { OnboardingScreen } from "@/components/scape-pulse/flow/screens/onboarding-screen";
import { ProfileScreen } from "@/components/scape-pulse/flow/screens/profile-screen";
import { RaceCameraScreen } from "@/components/scape-pulse/flow/screens/race-camera-screen";
import type { FlowScreen, TeamMember } from "@/components/scape-pulse/flow/types";

export function ScapePulseFlow() {
  const [screen, setScreen] = useState<FlowScreen>("intro-1");
  const [classCodeChars, setClassCodeChars] = useState<string[]>(Array.from({ length: 6 }, () => ""));
  const [selectedAvatar, setSelectedAvatar] = useState("🦊");
  const [playerName, setPlayerName] = useState("Jun");
  const [squadName, setSquadName] = useState("Squad PULSE1");
  const [members, setMembers] = useState<TeamMember[]>([
    { id: "member-jun", avatar: "🦊", name: "Jun", role: "Gamemaster", isLeader: true }
  ]);
  const [expandedAddTeammate, setExpandedAddTeammate] = useState(false);
  const [newTeammateAvatar, setNewTeammateAvatar] = useState("🐙");
  const [newTeammateName, setNewTeammateName] = useState("Tania");
  const [isRequestingCameraPermission, setIsRequestingCameraPermission] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [checkpointImagePlaceholder, setCheckpointImagePlaceholder] = useState(
    RACE_FLOW_CONFIG.checkpoint.imagePlaceholderSrc
  );
  const [checkpointTargetMindSrc, setCheckpointTargetMindSrc] = useState(
    RACE_FLOW_CONFIG.checkpoint.targetMindFileSrc
  );
  const [dialogueStepIndex, setDialogueStepIndex] = useState(0);
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);

  const activeSlide = useMemo(
    () => ONBOARDING_SLIDES.find((slide) => slide.id === screen),
    [screen]
  );

  const classCodeValue = useMemo(() => classCodeChars.join(""), [classCodeChars]);
  const canJoinClass = classCodeValue === "PULSE1";

  const advanceOnboarding = () => {
    setScreen((previousScreen) => {
      if (previousScreen === "intro-1") return "intro-2";
      if (previousScreen === "intro-2") return "intro-3";
      if (previousScreen === "intro-3") return "intro-4";
      return "class-code";
    });
  };

  const updateCodeChar = (index: number, rawValue: string) => {
    const clean = rawValue.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    setClassCodeChars((previousChars) => {
      const nextChars = [...previousChars];

      if (!clean) {
        nextChars[index] = "";
        return nextChars;
      }

      if (clean.length === 1) {
        nextChars[index] = clean;
      } else {
        clean
          .slice(0, 6 - index)
          .split("")
          .forEach((character, offset) => {
            nextChars[index + offset] = character;
          });
      }

      return nextChars;
    });

    if (clean.length > 1) {
      const finalIndex = Math.min(index + clean.length, 5);
      codeRefs.current[finalIndex]?.focus();
      return;
    }

    if (clean && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const pasteCodeChars = (index: number, pastedValue: string) => {
    const clean = pastedValue.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    if (!clean) {
      return;
    }

    setClassCodeChars((previousChars) => {
      const nextChars = [...previousChars];
      clean
        .slice(0, 6 - index)
        .split("")
        .forEach((character, offset) => {
          nextChars[index + offset] = character;
        });
      return nextChars;
    });

    const focusIndex = Math.min(index + clean.length, 5);
    codeRefs.current[focusIndex]?.focus();
  };

  const focusPreviousCodeChar = (index: number) => {
    if (index <= 0) {
      return;
    }

    codeRefs.current[index - 1]?.focus();
    setClassCodeChars((previousChars) => {
      const nextChars = [...previousChars];
      nextChars[index - 1] = "";
      return nextChars;
    });
  };

  const joinGame = () => {
    if (canJoinClass) {
      setScreen("profile");
    }
  };

  const continueFromProfile = () => {
    const cleanName = playerName.trim() || "Jun";
    const nextSquadName = `Squad ${classCodeValue || "PULSE1"}`;

    setPlayerName(cleanName);
    setSquadName(nextSquadName);
    setMembers([
      {
        id: "member-gamemaster",
        avatar: selectedAvatar,
        name: cleanName,
        role: "Gamemaster",
        isLeader: true
      }
    ]);
    setScreen("handoff");
  };

  const addTeammate = () => {
    const trimmedName = newTeammateName.trim();
    if (!trimmedName) {
      return;
    }

    setMembers((previousMembers) => {
      const teammateNumber = previousMembers.filter((member) => member.role === "Teammate").length + 1;
      return [
        ...previousMembers,
        {
          id: `member-teammate-${teammateNumber}`,
          avatar: newTeammateAvatar,
          name: trimmedName,
          role: "Teammate"
        }
      ];
    });

    setExpandedAddTeammate(false);
    setNewTeammateName("");
  };

  const openCameraPermissionStep = () => {
    setDialogueStepIndex(0);
    setCameraPermissionError(null);
    setScreen("camera-permission");
  };

  const requestCameraPermission = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraPermissionError("This browser does not support camera access.");
      return;
    }

    setIsRequestingCameraPermission(true);
    setCameraPermissionError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      stream.getTracks().forEach((track) => track.stop());
      setScreen("ar-race");
    } catch {
      setCameraPermissionError("Camera permission is required to open the AR checkpoint scanner.");
    } finally {
      setIsRequestingCameraPermission(false);
    }
  };

  const advanceDialogueStep = () => {
    setDialogueStepIndex((currentStep) => Math.min(currentStep + 1, RACE_FLOW_CONFIG.dialogue.length));
  };

  const onCheckpointMatched = () => {
    setScreen("checkpoint-cleared");
  };

  const openFinalDestinationCarousel = () => {
    setScreen("final-destination-carousel");
  };

  const backToLobby = () => {
    setDialogueStepIndex(0);
    setCameraPermissionError(null);
    setIsRequestingCameraPermission(false);
    setScreen("lobby");
  };

  useEffect(() => {
    if (screen !== "handoff") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setScreen("lobby");
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [screen]);

  useEffect(() => {
    if (screen !== "checkpoint-cleared") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setScreen("final-destination-carousel");
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [screen]);

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,rgba(255,107,0,0.12),transparent_35%),#050505] md:px-6 md:py-8">
      <main className="mx-auto min-h-[100dvh] w-full max-w-[393px] overflow-x-hidden bg-[#0a0a0a] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)] md:min-h-[852px] md:rounded-[24px]">
        {activeSlide ? (
          <OnboardingScreen onNext={advanceOnboarding} onSkip={() => setScreen("class-code")} slide={activeSlide} />
        ) : null}

        {screen === "class-code" ? (
          <ClassCodeScreen
            canJoin={canJoinClass}
            codeChars={classCodeChars}
            codeRefs={codeRefs}
            onBackToIntro={() => setScreen("intro-1")}
            onCodeBackspace={focusPreviousCodeChar}
            onCodeCharChange={updateCodeChar}
            onCodePaste={pasteCodeChars}
            onJoin={joinGame}
          />
        ) : null}

        {screen === "profile" ? (
          <ProfileScreen
            onAvatarChange={setSelectedAvatar}
            onContinue={continueFromProfile}
            onPlayerNameChange={setPlayerName}
            playerName={playerName}
            selectedAvatar={selectedAvatar}
          />
        ) : null}

        {screen === "handoff" ? (
          <HandoffScreen
            gamemasterAvatar={selectedAvatar}
            gamemasterName={playerName}
            onPassPhone={() => setScreen("lobby")}
          />
        ) : null}

        {screen === "lobby" ? (
          <LobbyScreen
            expandedAddTeammate={expandedAddTeammate}
            members={members}
            newTeammateAvatar={newTeammateAvatar}
            newTeammateName={newTeammateName}
            onAddTeammate={addTeammate}
            onStartRace={openCameraPermissionStep}
            setExpandedAddTeammate={setExpandedAddTeammate}
            setNewTeammateAvatar={setNewTeammateAvatar}
            setNewTeammateName={setNewTeammateName}
            setSquadName={setSquadName}
            squadName={squadName}
          />
        ) : null}

        {screen === "camera-permission" ? (
          <CameraPermissionScreen
            cameraPermissionError={cameraPermissionError}
            checkpointImagePlaceholder={checkpointImagePlaceholder}
            checkpointTargetMindSrc={checkpointTargetMindSrc}
            isRequestingCameraPermission={isRequestingCameraPermission}
            onBackToLobby={backToLobby}
            onCheckpointImagePlaceholderChange={setCheckpointImagePlaceholder}
            onCheckpointTargetMindSrcChange={setCheckpointTargetMindSrc}
            onRequestCameraPermission={requestCameraPermission}
          />
        ) : null}

        {screen === "ar-race" ? (
          <RaceCameraScreen
            checkpointImagePlaceholder={checkpointImagePlaceholder}
            checkpointTargetMindSrc={checkpointTargetMindSrc}
            config={RACE_FLOW_CONFIG}
            dialogueStepIndex={dialogueStepIndex}
            onAdvanceDialogue={advanceDialogueStep}
            onBackToLobby={backToLobby}
            onCheckpointMatched={onCheckpointMatched}
          />
        ) : null}

        {screen === "checkpoint-cleared" ? (
          <CheckpointClearedScreen
            checkpointName={RACE_FLOW_CONFIG.checkpoint.name}
            mascotName={RACE_FLOW_CONFIG.mascotName}
            onViewFinalDestination={openFinalDestinationCarousel}
            onBackToLobby={backToLobby}
          />
        ) : null}

        {screen === "final-destination-carousel" ? (
          <FinalDestinationCarouselScreen media={ENDING_CAROUSEL_DEFAULT_MEDIA} onBackToLobby={backToLobby} />
        ) : null}
      </main>
    </div>
  );
}
