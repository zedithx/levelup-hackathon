"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";

type FlowScreen =
  | "intro-1"
  | "intro-2"
  | "intro-3"
  | "intro-4"
  | "class-code"
  | "profile"
  | "handoff"
  | "lobby";

type OnboardingSlide = {
  id: Extract<FlowScreen, "intro-1" | "intro-2" | "intro-3" | "intro-4">;
  progressStep: 1 | 2 | 3 | 4;
  stepLabel: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accent: {
    color: string;
    tileBackground: string;
    tileBorder: string;
    orb: string;
  };
  ctaLabel: string;
};

type TeamMember = {
  id: string;
  avatar: string;
  name: string;
  role: "Gamemaster" | "Teammate";
  isLeader?: boolean;
};

const ASSETS = {
  logoZap: "https://www.figma.com/api/mcp/asset/8b9ab8d9-9f3d-44b8-ba8d-99ba8b05f972",
  arrowRight:
    "https://www.figma.com/api/mcp/asset/f0932723-fe47-4f4e-a993-ed78deb0729a",
  stepOneIcon:
    "https://www.figma.com/api/mcp/asset/477c8aa6-0add-4990-b200-839803cd8157",
  stepTwoIcon:
    "https://www.figma.com/api/mcp/asset/cb90dc89-50a7-4713-95dd-eaf7a744cf56",
  stepThreeIcon:
    "https://www.figma.com/api/mcp/asset/269d977d-c915-49cf-9682-853b7cadc7ee",
  stepFourIcon:
    "https://www.figma.com/api/mcp/asset/0b8a7b52-857b-462c-806a-69ce8c26d5c1",
  classCodeIcon:
    "https://www.figma.com/api/mcp/asset/31d73bef-1eec-490d-92e6-87ac12f91789",
  profileIcon:
    "https://www.figma.com/api/mcp/asset/c252c5dc-2b00-434c-b7a1-4d20b9738a9e",
  swordsIcon:
    "https://www.figma.com/api/mcp/asset/c51dc71e-10f4-486e-810a-a61638ab7aeb",
  crownIcon:
    "https://www.figma.com/api/mcp/asset/6cb4c8a3-7d97-4bd9-ae39-55c79d080ec8",
  phoneIcon:
    "https://www.figma.com/api/mcp/asset/be2451f4-0ca6-4b62-8759-1361345e2351",
  editIcon:
    "https://www.figma.com/api/mcp/asset/66beb011-30a2-4afa-8537-9c5d7a6a24d7",
  userPlusIcon:
    "https://www.figma.com/api/mcp/asset/3c191494-d4b9-4f2e-82c1-e95dbdb94bca",
  botIcon: "https://www.figma.com/api/mcp/asset/e0edd825-ac07-429b-ad7e-d578e405f4f3",
  checkIcon:
    "https://www.figma.com/api/mcp/asset/0444442b-f1b5-4918-8b80-e0e4d3848202"
} as const;

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "intro-1",
    progressStep: 1,
    stepLabel: "STEP 1 OF 4",
    title: "WELCOME TO PULSE",
    subtitle: "Your school adventure starts now.",
    description:
      "Pulse is a gamified experience across your school grounds - your squad will explore stations, solve challenges, and compete to be the top team. All from one shared phone!",
    icon: ASSETS.stepOneIcon,
    accent: {
      color: "#ff6b00",
      tileBackground: "rgba(255,107,0,0.08)",
      tileBorder: "rgba(255,107,0,0.2)",
      orb: "rgba(255,107,0,0.27)"
    },
    ctaLabel: "Next"
  },
  {
    id: "intro-2",
    progressStep: 2,
    stepLabel: "STEP 2 OF 4",
    title: "HOW IT WORKS",
    subtitle: "Team up. Play. Conquer.",
    description:
      "Your team shares one phone. Visit each station around school, complete quick challenges together - trivia, puzzles, photo missions - and rack up points as a squad.",
    icon: ASSETS.stepTwoIcon,
    accent: {
      color: "#00d4ff",
      tileBackground: "rgba(0,212,255,0.08)",
      tileBorder: "rgba(0,212,255,0.2)",
      orb: "rgba(0,212,255,0.27)"
    },
    ctaLabel: "Next"
  },
  {
    id: "intro-3",
    progressStep: 3,
    stepLabel: "STEP 3 OF 4",
    title: "MEET YOUR AR BUDDY",
    subtitle: "A mascot that guides you IRL.",
    description:
      "After each challenge, your AR mascot pops up on screen and shows you the way to the next station with a 3D arrow. Follow it through your school - no map needed!",
    icon: ASSETS.stepThreeIcon,
    accent: {
      color: "#ff3399",
      tileBackground: "rgba(255,51,153,0.08)",
      tileBorder: "rgba(255,51,153,0.2)",
      orb: "rgba(255,51,153,0.27)"
    },
    ctaLabel: "Next"
  },
  {
    id: "intro-4",
    progressStep: 4,
    stepLabel: "STEP 4 OF 4",
    title: "CLIMB THE RANKS",
    subtitle: "Class vs. class. Squad vs. squad.",
    description:
      "Scores are tracked live on the leaderboard. Compete against other teams across school - top squads win bragging rights and prizes. Speed bonuses for finishing fast!",
    icon: ASSETS.stepFourIcon,
    accent: {
      color: "#ffd700",
      tileBackground: "rgba(255,215,0,0.08)",
      tileBorder: "rgba(255,215,0,0.2)",
      orb: "rgba(255,215,0,0.27)"
    },
    ctaLabel: "Let's Go"
  }
];

const AVATAR_CHOICES = [
  "🦊",
  "🐯",
  "🦁",
  "🐺",
  "🦅",
  "🐉",
  "🦈",
  "🐙",
  "🦖",
  "🎯",
  "⚡",
  "🔥",
  "💎",
  "🌟",
  "🚀",
  "🎮"
];

const LOBBY_AVATAR_CHOICES = [
  "🦊",
  "🐯",
  "🦁",
  "🐺",
  "🦅",
  "🐉",
  "🦈",
  "🐙",
  "🦖",
  "🎯",
  "⚡",
  "🔥",
  "💎",
  "🌟",
  "🚀",
  "🎮"
];

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type BrandBarProps = {
  showSkip?: boolean;
  onSkip?: () => void;
  showPhoneIndicator?: boolean;
};

function BrandBar({ showSkip, onSkip, showPhoneIndicator }: BrandBarProps) {
  return (
    <header className="flex h-14 items-center justify-between px-5">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-[10px] bg-[#ff6b00]">
          <img alt="" className="size-4" src={ASSETS.logoZap} />
        </div>
        <p className="font-display text-[clamp(1rem,4.5vw,1.125rem)] leading-7 tracking-[0.045em]">
          <span className="text-[#ff6b00]">*SCAPE</span>
          <span className="text-white/85"> </span>
          <span className="text-white/20">|</span>
          <span className="text-white/85"> PULSE</span>
        </p>
      </div>

      {showSkip ? (
        <button
          className="text-sm font-bold text-white/30 transition-colors hover:text-white/60"
          onClick={onSkip}
          type="button"
        >
          Skip
        </button>
      ) : null}

      {showPhoneIndicator ? (
        <p className="flex items-center gap-1.5 text-xs text-white/30">
          <img alt="" className="size-3" src={ASSETS.phoneIcon} />
          <span>1 phone</span>
        </p>
      ) : null}
    </header>
  );
}

type ProgressDotsProps = {
  step: 1 | 2 | 3 | 4 | 5;
};

function ProgressDots({ step }: ProgressDotsProps) {
  return (
    <div className="flex h-7 items-center justify-center gap-2">
      {Array.from({ length: 5 }).map((_, index) => {
        const marker = index + 1;
        const isCurrent = marker === step;
        const isComplete = marker < step;
        const widthClass = isCurrent ? "w-6" : isComplete ? "w-4" : "w-2";

        return (
          <span
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              widthClass,
              isCurrent || isComplete ? "bg-[#ff6b00]" : "bg-white/10"
            )}
            key={marker}
          />
        );
      })}
    </div>
  );
}

type PrimaryButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
};

function PrimaryButton({
  label,
  onClick,
  disabled,
  fullWidth = true,
  ariaLabel
}: PrimaryButtonProps) {
  return (
    <button
      aria-label={ariaLabel ?? label}
      className={cn(
        "inline-flex h-[clamp(3.25rem,8vh,3.75rem)] items-center justify-center gap-2 rounded-2xl px-5 text-[clamp(1rem,4.5vw,1.125rem)] leading-7 tracking-[0.045em] transition-colors",
        "font-display",
        fullWidth ? "w-full" : "w-auto",
        disabled
          ? "bg-[rgba(255,107,0,0.3)] text-white/40"
          : "bg-[#ff6b00] text-white hover:bg-[#ff7e24]"
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span>{label.toUpperCase()}</span>
      <img alt="" className={cn("size-4", disabled ? "opacity-30" : "opacity-100")} src={ASSETS.arrowRight} />
    </button>
  );
}

type OnboardingScreenProps = {
  slide: OnboardingSlide;
  onNext: () => void;
  onSkip: () => void;
};

function OnboardingScreen({ slide, onNext, onSkip }: OnboardingScreenProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col md:min-h-[852px]">
      <BrandBar onSkip={onSkip} showSkip />
      <ProgressDots step={slide.progressStep} />

      <div className="flex flex-1 flex-col px-5 pb-6 pt-2">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div
            className="relative mb-7 flex size-[min(28vw,7rem)] items-center justify-center rounded-3xl border"
            style={{
              backgroundColor: slide.accent.tileBackground,
              borderColor: slide.accent.tileBorder
            }}
          >
            <img alt="" className="size-14" src={slide.icon} />
            <span
              className="absolute -right-2 -top-2 size-4 rounded-full"
              style={{ backgroundColor: slide.accent.orb }}
            />
            <span
              className="absolute -bottom-1.5 -left-1.5 size-3 rounded-full"
              style={{ backgroundColor: slide.accent.tileBorder }}
            />
          </div>

          <p
            className="mb-4 text-center text-xs font-normal tracking-[0.3em]"
            style={{ color: slide.accent.color }}
          >
            {slide.stepLabel}
          </p>
          <h1 className="mb-4 text-center font-display text-[clamp(2rem,9vw,2.3rem)] leading-none tracking-[0.03em] text-white">
            {slide.title}
          </h1>
          <p className="mb-5 text-center text-[clamp(0.92rem,3.7vw,1rem)] font-normal leading-5 text-white/60">
            {slide.subtitle}
          </p>
          <p className="max-w-[320px] text-center text-[clamp(0.9rem,3.6vw,1rem)] leading-[1.62] text-white/40">
            {slide.description}
          </p>
        </div>

        <PrimaryButton label={slide.ctaLabel} onClick={onNext} />
      </div>
    </div>
  );
}

type ClassCodeScreenProps = {
  codeChars: string[];
  onCodeCharChange: (index: number, value: string) => void;
  onCodePaste: (index: number, value: string) => void;
  onCodeBackspace: (index: number) => void;
  codeRefs: MutableRefObject<Array<HTMLInputElement | null>>;
  onJoin: () => void;
  onBackToIntro: () => void;
  canJoin: boolean;
};

function ClassCodeScreen({
  codeChars,
  onCodeCharChange,
  onCodePaste,
  onCodeBackspace,
  codeRefs,
  onJoin,
  onBackToIntro,
  canJoin
}: ClassCodeScreenProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col md:min-h-[852px]">
      <BrandBar />
      <ProgressDots step={5} />

      <div className="flex flex-1 flex-col px-5 pb-6 pt-2">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="relative mb-9 flex size-20 items-center justify-center rounded-2xl border border-[rgba(255,107,0,0.2)] bg-[rgba(255,107,0,0.1)]">
            <img alt="" className="size-10" src={ASSETS.classCodeIcon} />
          </div>

          <h1 className="mb-4 text-center font-display text-[clamp(1.9rem,8.6vw,2.2rem)] leading-none tracking-[0.03em] text-white">
            ENTER YOUR CLASS CODE
          </h1>
          <p className="mb-8 max-w-[320px] text-center text-[clamp(0.9rem,3.6vw,1rem)] leading-[1.4] text-white/40">
            Your teacher or facilitator will give you a 6-character code. Ask them if you
            do not have one!
          </p>

          <fieldset className="mb-4 flex w-full justify-center gap-[clamp(0.35rem,1.8vw,0.625rem)]">
            <legend className="sr-only">Class code input</legend>
            {codeChars.map((character, index) => (
              <input
                aria-label={`Code character ${index + 1}`}
                className={cn(
                  "h-[clamp(2.9rem,7vh,3.5rem)] w-[clamp(2.2rem,11vw,3rem)] rounded-[14px] border text-center text-lg uppercase transition-colors",
                  "bg-[#1a1a1a] text-white focus:border-[#ff6b00] focus:outline-none",
                  character ? "border-[#ff6b00]/45" : "border-white/10"
                )}
                inputMode="text"
                key={index}
                maxLength={1}
                onChange={(event) => onCodeCharChange(index, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && !character) {
                    onCodeBackspace(index);
                  }
                }}
                onPaste={(event) => {
                  event.preventDefault();
                  onCodePaste(index, event.clipboardData.getData("text"));
                }}
                ref={(node) => {
                  codeRefs.current[index] = node;
                }}
                value={character}
              />
            ))}
          </fieldset>

          <p className="text-center text-xs text-white/20">Demo code: PULSE1</p>
        </div>

        <div className="space-y-2">
          <PrimaryButton disabled={!canJoin} label="Join Game" onClick={onJoin} />
          <button
            className="h-11 w-full text-sm font-bold text-white/20 transition-colors hover:text-white/45"
            onClick={onBackToIntro}
            type="button"
          >
            Back to intro
          </button>
        </div>
      </div>
    </div>
  );
}

type ProfileScreenProps = {
  selectedAvatar: string;
  onAvatarChange: (avatar: string) => void;
  playerName: string;
  onPlayerNameChange: (value: string) => void;
  onContinue: () => void;
};

function ProfileScreen({
  selectedAvatar,
  onAvatarChange,
  playerName,
  onPlayerNameChange,
  onContinue
}: ProfileScreenProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col md:min-h-[852px]">
      <BrandBar />

      <div className="flex flex-1 flex-col px-5 pb-6 pt-2">
        <div className="flex flex-1 flex-col items-center">
          <div className="relative mb-7 mt-[clamp(1.5rem,8vh,4.25rem)] flex size-24 items-center justify-center rounded-3xl border border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.1)]">
            <img alt="" className="size-12" src={ASSETS.profileIcon} />
            <span className="absolute -right-2 -top-2 size-4 rounded-full bg-[rgba(0,212,255,0.3)]" />
          </div>

          <p className="mb-2 text-center text-xs tracking-[0.3em] text-[#00d4ff]">CODE ACCEPTED</p>
          <h1 className="mb-3 text-center font-display text-[clamp(2rem,9vw,2.35rem)] leading-none tracking-[0.03em] text-white">
            WHAT&apos;S YOUR NAME?
          </h1>
          <p className="mb-7 max-w-[320px] text-center text-[clamp(0.9rem,3.6vw,1rem)] leading-[1.4] text-white/40">
            This is how your squad will know you. Pick a name and an avatar!
          </p>

          <p className="mb-2 text-center text-xs tracking-[0.05em] text-white/30">CHOOSE YOUR AVATAR</p>
          <div className="mb-6 grid w-full max-w-[280px] grid-cols-5 gap-2">
            {AVATAR_CHOICES.map((avatar, index) => (
              <button
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-[14px] border text-lg transition-colors",
                  selectedAvatar === avatar
                    ? "border-[#00d4ff] bg-[rgba(0,212,255,0.2)]"
                    : "border-transparent bg-white/5 hover:bg-white/10",
                  index === AVATAR_CHOICES.length - 1 ? "col-start-3" : ""
                )}
                key={avatar}
                onClick={() => onAvatarChange(avatar)}
                type="button"
              >
                {avatar}
              </button>
            ))}
          </div>

          <label className="sr-only" htmlFor="player-name">
            Player name
          </label>
          <input
            className="mb-7 h-[54px] w-full rounded-[14px] border border-[rgba(231,249,255,0.12)] bg-[#1a1a1a] px-4 text-base text-white placeholder:text-white/50 focus:border-[#00d4ff] focus:outline-none"
            id="player-name"
            maxLength={24}
            onChange={(event) => onPlayerNameChange(event.target.value)}
            placeholder="Enter your name"
            value={playerName}
          />
        </div>

        <PrimaryButton label="Continue" onClick={onContinue} />
      </div>
    </div>
  );
}

type HandoffScreenProps = {
  gamemasterName: string;
  gamemasterAvatar: string;
  onPassPhone: () => void;
};

function HandoffScreen({ gamemasterName, gamemasterAvatar, onPassPhone }: HandoffScreenProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col md:min-h-[852px]">
      <BrandBar />

      <div className="flex flex-1 flex-col items-center px-5 pb-8 pt-5">
        <div className="relative mb-7 mt-[clamp(2rem,10vh,5rem)] flex size-28 items-center justify-center rounded-3xl border-2 border-[#ffd700] bg-[rgba(255,215,0,0.08)] shadow-[0_0_40px_rgba(255,215,0,0.14)]">
          <span className="text-5xl">{gamemasterAvatar}</span>
          <span className="absolute -right-3 -top-3 flex size-10 items-center justify-center rounded-full bg-[#ffd700] shadow-[0_0_20px_rgba(255,215,0,0.32)]">
            <img alt="" className="size-5" src={ASSETS.crownIcon} />
          </span>
        </div>

        <p className="mb-2 text-xs tracking-[0.3em] text-[#ffd700]">YOU&apos;RE THE GAMEMASTER</p>
        <p className="mb-4 font-display text-[clamp(2.1rem,9.5vw,2.6rem)] leading-none text-[#ffd700]">
          {gamemasterName.toUpperCase()}
        </p>
        <p className="mb-6 max-w-[320px] text-center text-[clamp(0.9rem,3.6vw,1rem)] leading-[1.55] text-white/50">
          Lead your squad to victory! Add your teammates, name your team, and start the adventure.
        </p>

        <button
          className="mb-8 inline-flex h-[38px] items-center gap-2 rounded-full border border-[rgba(255,107,0,0.32)] bg-[rgba(255,107,0,0.1)] px-5 text-[clamp(0.85rem,3.4vw,0.95rem)] leading-5 text-[#ff6b00] transition-colors hover:bg-[rgba(255,107,0,0.18)]"
          onClick={onPassPhone}
          type="button"
        >
          <img alt="" className="size-4" src={ASSETS.swordsIcon} />
          <span>Pass the phone to add your squad</span>
        </button>

        <p className="mb-3 text-xs text-white/20">Loading your lobby...</p>
        <span className="h-8 w-5 animate-spin rounded-full border border-white/10 border-t-white/35" />
      </div>
    </div>
  );
}

type LobbyScreenProps = {
  squadName: string;
  setSquadName: (name: string) => void;
  members: TeamMember[];
  expandedAddTeammate: boolean;
  setExpandedAddTeammate: (expanded: boolean) => void;
  newTeammateAvatar: string;
  setNewTeammateAvatar: (avatar: string) => void;
  newTeammateName: string;
  setNewTeammateName: (name: string) => void;
  onAddTeammate: () => void;
};

function LobbyScreen({
  squadName,
  setSquadName,
  members,
  expandedAddTeammate,
  setExpandedAddTeammate,
  newTeammateAvatar,
  setNewTeammateAvatar,
  newTeammateName,
  setNewTeammateName,
  onAddTeammate
}: LobbyScreenProps) {
  const [editingSquadName, setEditingSquadName] = useState(false);
  const minTeammateCountMet = members.length > 1;
  const memberLabel = `${members.length} ${members.length === 1 ? "member" : "members"}`;

  return (
    <div className="flex min-h-[100dvh] flex-col md:min-h-[852px]">
      <BrandBar showPhoneIndicator />

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div className="pt-4">
          <div className="mb-1 flex items-center justify-center gap-2">
            {editingSquadName ? (
              <label className="sr-only" htmlFor="squad-name">
                Squad name
              </label>
            ) : null}

            {editingSquadName ? (
              <input
                autoFocus
                className="h-9 w-[min(60vw,215px)] rounded-[10px] border border-white/10 bg-white/5 px-3 text-center font-display text-[clamp(1.75rem,7vw,1.9rem)] leading-none tracking-[0.03em] text-white focus:border-[#ff6b00] focus:outline-none"
                id="squad-name"
                maxLength={20}
                onBlur={() => setEditingSquadName(false)}
                onChange={(event) => setSquadName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setEditingSquadName(false);
                  }
                }}
                value={squadName}
              />
            ) : (
              <h2 className="font-display text-[clamp(1.75rem,7vw,1.9rem)] leading-none tracking-[0.03em] text-white">{squadName}</h2>
            )}

            <button
              className="flex size-8 items-center justify-center rounded-[10px] bg-white/5 transition-colors hover:bg-white/10"
              onClick={() => setEditingSquadName((current) => !current)}
              type="button"
            >
              <img alt="" className="size-3.5" src={ASSETS.editIcon} />
            </button>
          </div>
          <p className="text-center text-xs tracking-[0.05em] text-white/25">TAP THE PENCIL TO NAME YOUR SQUAD</p>
        </div>

        <div className="mt-4 rounded-[14px] border border-[rgba(255,107,0,0.15)] bg-[rgba(255,107,0,0.08)] px-4 py-3">
          <p className="text-[clamp(0.85rem,3.35vw,0.95rem)] leading-[1.6] text-white/50">
            <span className="mr-1 inline-flex align-text-bottom">
              <img alt="" className="size-4" src={ASSETS.phoneIcon} />
            </span>
            <span className="font-bold text-[#ff6b00]">One phone, one team.</span> Pass the phone around - each
            teammate taps Add Teammate, enters their name, then passes it to the next person.
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs tracking-[0.05em] text-white/30">SQUAD MEMBERS</p>
          <p className="text-xs text-white/20">{memberLabel}</p>
        </div>

        <div className="mt-2 space-y-2">
          {members.map((member) => (
            <div
              className="flex h-[74px] items-center gap-3 rounded-[14px] border border-white/5 bg-[#1a1a1a] px-4"
              key={member.id}
            >
              <span className="flex size-11 items-center justify-center rounded-[14px] bg-white/5 text-2xl">
                {member.avatar}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[clamp(1.15rem,4.6vw,1.35rem)] leading-6 text-white">{member.name}</p>
                  {member.isLeader ? <img alt="" className="size-3.5" src={ASSETS.crownIcon} /> : null}
                </div>
                <p className="text-xs text-white/20">{member.role}</p>
              </div>
            </div>
          ))}

          {!expandedAddTeammate ? (
            <button
              className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] border border-white/10 text-sm font-bold text-white/30 transition-colors hover:border-[#ff6b00]/40 hover:text-white/70"
              onClick={() => setExpandedAddTeammate(true)}
              type="button"
            >
              <img alt="" className="size-4" src={ASSETS.userPlusIcon} />
              <span>Add Teammate</span>
            </button>
          ) : (
            <div className="rounded-[14px] border border-[rgba(255,107,0,0.45)] bg-[#1a1a1a] p-4">
              <p className="mb-3 font-display text-sm tracking-[0.03em] text-[#ff6b00]">PASS THE PHONE - NEW TEAMMATE!</p>
              <div className="mb-3 grid grid-cols-7 gap-1.5 sm:gap-2">
                {LOBBY_AVATAR_CHOICES.map((avatar) => (
                  <button
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-[10px] border text-sm transition-colors",
                      avatar === newTeammateAvatar
                        ? "border-[#ff6b00] bg-[rgba(255,107,0,0.2)]"
                        : "border-transparent bg-white/5 hover:bg-white/10"
                    )}
                    key={avatar}
                    onClick={() => setNewTeammateAvatar(avatar)}
                    type="button"
                  >
                    {avatar}
                  </button>
                ))}
              </div>
              <div className="mb-2 flex items-center gap-2">
                <label className="sr-only" htmlFor="new-teammate-name">
                  New teammate name
                </label>
                <input
                  className="h-[46px] flex-1 rounded-[14px] border border-white/10 bg-[#0a0a0a] px-4 text-base text-white placeholder:text-white/50 focus:border-[#ff6b00] focus:outline-none"
                  id="new-teammate-name"
                  maxLength={24}
                  onChange={(event) => setNewTeammateName(event.target.value)}
                  placeholder="Teammate name"
                  value={newTeammateName}
                />
                <button
                  className={cn(
                    "flex h-[46px] w-[52px] items-center justify-center rounded-[14px] transition-colors",
                    newTeammateName.trim()
                      ? "bg-[#ff6b00] hover:bg-[#ff7e24]"
                      : "bg-[rgba(255,107,0,0.3)]"
                  )}
                  disabled={!newTeammateName.trim()}
                  onClick={onAddTeammate}
                  type="button"
                >
                  <img alt="" className={cn("size-5", newTeammateName.trim() ? "opacity-100" : "opacity-40")} src={ASSETS.checkIcon} />
                </button>
              </div>
              <button
                className="h-8 w-full text-xs font-bold text-white/20 transition-colors hover:text-white/45"
                onClick={() => setExpandedAddTeammate(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-[14px] border border-[rgba(255,51,153,0.15)] bg-[rgba(255,51,153,0.08)] px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-[rgba(255,51,153,0.15)]">
              <img alt="" className="size-4" src={ASSETS.botIcon} />
            </span>
            <p className="text-[clamp(0.85rem,3.35vw,0.95rem)] leading-[1.6] text-white/40">
              Once you start, your <span className="text-[#ff3399]">AR Buddy</span> will appear after each station to
              guide your squad to the next challenge!
            </p>
          </div>
        </div>

        <div className="pt-3">
          <p className="mb-1 text-center text-xs text-white/25">
            {minTeammateCountMet ? "Your squad is ready to start." : "Add at least 1 more teammate to start"}
          </p>
          <button
            className={cn(
              "flex h-[60px] w-full items-center justify-center rounded-2xl font-display text-[clamp(1rem,4.4vw,1.12rem)] leading-7 tracking-[0.045em] transition-colors",
              minTeammateCountMet
                ? "bg-[#ff6b00] text-white hover:bg-[#ff7e24]"
                : "bg-[rgba(255,107,0,0.15)] text-white/20"
            )}
            disabled={!minTeammateCountMet}
            type="button"
          >
            {minTeammateCountMet ? "START THE RACE" : "NEED MORE TEAMMATES"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);

  const activeSlide = useMemo(
    () =>
      ONBOARDING_SLIDES.find((slide) => {
        return slide.id === screen;
      }),
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
    if (index > 0) {
      codeRefs.current[index - 1]?.focus();
      setClassCodeChars((previousChars) => {
        const nextChars = [...previousChars];
        nextChars[index - 1] = "";
        return nextChars;
      });
    }
  };

  const joinGame = () => {
    if (!canJoinClass) {
      return;
    }
    setScreen("profile");
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

  useEffect(() => {
    if (screen !== "handoff") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setScreen("lobby");
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [screen]);

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,rgba(255,107,0,0.12),transparent_35%),#050505] md:px-6 md:py-8">
      <main className="mx-auto w-full max-w-[393px] overflow-x-hidden bg-[#0a0a0a] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)] min-h-[100dvh] md:min-h-[852px] md:rounded-[24px]">
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
            setExpandedAddTeammate={setExpandedAddTeammate}
            setNewTeammateAvatar={setNewTeammateAvatar}
            setNewTeammateName={setNewTeammateName}
            setSquadName={setSquadName}
            squadName={squadName}
          />
        ) : null}
      </main>
    </div>
  );
}
