/* eslint-disable @next/next/no-img-element */

import { ASSETS, AVATAR_CHOICES } from "@/components/scape-pulse/flow/constants";
import { BrandBar, PrimaryButton } from "@/components/scape-pulse/flow/ui";
import { cn, reveal } from "@/components/scape-pulse/flow/utils";

type ProfileScreenProps = {
  selectedAvatar: string;
  onAvatarChange: (avatar: string) => void;
  playerName: string;
  onPlayerNameChange: (value: string) => void;
  onContinue: () => void;
};

export function ProfileScreen({
  selectedAvatar,
  onAvatarChange,
  playerName,
  onPlayerNameChange,
  onContinue
}: ProfileScreenProps) {
  return (
    <div className="anim-screen-in flex min-h-[100dvh] flex-col md:min-h-[852px]">
      <BrandBar />

      <div className="flex flex-1 flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-2">
        <div className="flex flex-1 flex-col items-center">
          <div
            className="anim-fade-up relative mb-7 mt-[clamp(1.5rem,8vh,4.25rem)] flex size-24 items-center justify-center rounded-3xl border border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.1)]"
            style={reveal(60)}
          >
            <img alt="" className="anim-float size-12" src={ASSETS.profileIcon} />
            <span className="absolute -right-2 -top-2 size-4 rounded-full bg-[rgba(0,212,255,0.3)]" />
          </div>

          <p className="anim-fade-up mb-2 text-center text-xs tracking-[0.3em] text-[#00d4ff]" style={reveal(120)}>
            CODE ACCEPTED
          </p>
          <h1
            className="anim-fade-up mb-3 text-center font-display text-[clamp(2rem,9vw,2.35rem)] leading-none tracking-[0.03em] text-white"
            style={reveal(170)}
          >
            WHAT&apos;S YOUR NAME?
          </h1>
          <p
            className="anim-fade-up mb-7 max-w-[320px] text-center text-[clamp(0.9rem,3.6vw,1rem)] leading-[1.4] text-white/40"
            style={reveal(220)}
          >
            This is how your squad will know you. Pick a name and an avatar!
          </p>

          <p className="anim-fade-up mb-2 text-center text-xs tracking-[0.05em] text-white/30" style={reveal(260)}>
            CHOOSE YOUR AVATAR
          </p>
          <div className="anim-fade-up mb-6 grid w-full max-w-[280px] grid-cols-5 gap-2" style={reveal(300)}>
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
            className="anim-fade-up mb-7 h-[54px] w-full rounded-[14px] border border-[rgba(231,249,255,0.12)] bg-[#1a1a1a] px-4 text-base text-white placeholder:text-white/50 focus:border-[#00d4ff] focus:outline-none"
            id="player-name"
            maxLength={24}
            onChange={(event) => onPlayerNameChange(event.target.value)}
            placeholder="Enter your name"
            style={reveal(350)}
            value={playerName}
          />
        </div>

        <div className="anim-fade-up" style={reveal(390)}>
          <PrimaryButton label="Continue" onClick={onContinue} />
        </div>
      </div>
    </div>
  );
}
