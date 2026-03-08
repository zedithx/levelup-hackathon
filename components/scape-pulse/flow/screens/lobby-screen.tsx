/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

import { ASSETS, LOBBY_AVATAR_CHOICES } from "@/components/scape-pulse/flow/constants";
import type { TeamMember } from "@/components/scape-pulse/flow/types";
import { BrandBar } from "@/components/scape-pulse/flow/ui";
import { cn, reveal } from "@/components/scape-pulse/flow/utils";

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
  onStartRace: () => void;
};

export function LobbyScreen({
  squadName,
  setSquadName,
  members,
  expandedAddTeammate,
  setExpandedAddTeammate,
  newTeammateAvatar,
  setNewTeammateAvatar,
  newTeammateName,
  setNewTeammateName,
  onAddTeammate,
  onStartRace
}: LobbyScreenProps) {
  const [editingSquadName, setEditingSquadName] = useState(false);
  const minTeammateCountMet = members.length > 1;
  const memberLabel = `${members.length} ${members.length === 1 ? "member" : "members"}`;

  return (
    <div className="anim-screen-in flex min-h-[100dvh] flex-col md:min-h-[852px]">
      <BrandBar showPhoneIndicator />

      <div className="flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
        <div className="anim-fade-up pt-4" style={reveal(60)}>
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

        <div className="anim-fade-up mt-4 rounded-[14px] border border-[rgba(255,107,0,0.15)] bg-[rgba(255,107,0,0.08)] px-4 py-3" style={reveal(120)}>
          <p className="text-[clamp(0.85rem,3.35vw,0.95rem)] leading-[1.6] text-white/50">
            <span className="mr-1 inline-flex align-text-bottom">
              <img alt="" className="size-4" src={ASSETS.phoneIcon} />
            </span>
            <span className="font-bold text-[#ff6b00]">One phone, one team.</span> Pass the phone around - each
            teammate taps Add Teammate, enters their name, then passes it to the next person.
          </p>
        </div>

        <div className="anim-fade-up mt-4 flex items-center justify-between" style={reveal(170)}>
          <p className="text-xs tracking-[0.05em] text-white/30">SQUAD MEMBERS</p>
          <p className="text-xs text-white/20">{memberLabel}</p>
        </div>

        <div className="anim-fade-up mt-2 space-y-2" style={reveal(210)}>
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
              className="anim-elevate btn-fit flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] border border-white/10 text-sm font-bold text-white/30 transition-colors hover:border-[#ff6b00]/40 hover:text-white/70"
              onClick={() => setExpandedAddTeammate(true)}
              type="button"
            >
              <img alt="" className="size-4" src={ASSETS.userPlusIcon} />
              <span>Add Teammate</span>
            </button>
          ) : (
            <div className="anim-pop-in rounded-[14px] border border-[rgba(255,107,0,0.45)] bg-[#1a1a1a] p-4">
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

        <div className="anim-fade-up mt-4 rounded-[14px] border border-[rgba(255,51,153,0.15)] bg-[rgba(255,51,153,0.08)] px-4 py-3" style={reveal(280)}>
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

        <div className="anim-fade-up pt-3" style={reveal(340)}>
          <p className="mb-1 text-center text-xs text-white/25">
            {minTeammateCountMet ? "Your squad is ready to start." : "Add at least 1 more teammate to start"}
          </p>
          <button
            className={cn(
              "anim-elevate btn-fit flex h-[60px] w-full items-center justify-center rounded-2xl font-display text-[clamp(1rem,4.4vw,1.12rem)] leading-7 tracking-[0.045em] transition-colors",
              minTeammateCountMet
                ? "bg-[#ff6b00] text-white hover:bg-[#ff7e24]"
                : "bg-[rgba(255,107,0,0.15)] text-white/20"
            )}
            disabled={!minTeammateCountMet}
            onClick={onStartRace}
            type="button"
          >
            {minTeammateCountMet ? "START THE RACE" : "NEED MORE TEAMMATES"}
          </button>
        </div>
      </div>
    </div>
  );
}
