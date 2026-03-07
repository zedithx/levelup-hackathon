import type { DrawingGameMember, DrawingGameSong, TurnAllocation } from "@/components/drawing-game/flow/types";
import { FlowShell, GhostButton, Panel, PrimaryButton } from "@/components/drawing-game/flow/ui";

type InstructionsScreenProps = {
  song: DrawingGameSong;
  members: DrawingGameMember[];
  turns: TurnAllocation[];
  canAddMember: boolean;
  canRemoveMember: boolean;
  onMemberNameChange: (memberId: string, name: string) => void;
  onAddMember: () => void;
  onRemoveMember: () => void;
  onStartRound: () => void;
};

export function InstructionsScreen({
  song,
  members,
  turns,
  canAddMember,
  canRemoveMember,
  onMemberNameChange,
  onAddMember,
  onRemoveMember,
  onStartRound
}: InstructionsScreenProps) {
  return (
    <FlowShell stepLabel="SETUP">
      <div className="anim-fade-up">
        <p className="text-xs tracking-[0.08em] text-[#ff6b00]">DRAWING GAME FLOW</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,8.8vw,2.4rem)] leading-none">SING RELAY</h1>
        <p className="mt-2 text-sm leading-6 text-white/60">
          Everyone gets a turn. Each player first hears a short music excerpt, then sings their full assigned section.
        </p>
      </div>

      <Panel className="anim-fade-up mt-4 border-[rgba(255,107,0,0.3)] bg-[rgba(255,107,0,0.08)]" >
        <p className="text-xs tracking-[0.07em] text-white/45">ROUND SETTING</p>
        <p className="mt-1 text-lg font-bold text-white">{song.title}</p>
        <p className="text-xs text-white/35">{song.artist}</p>
        <p className="mt-3 text-sm text-white/70">
          Song length: <span className="font-bold text-white">{song.totalDurationSec}s</span> | Members: <span className="font-bold text-white">{members.length}</span>
        </p>
      </Panel>

      <div className="anim-fade-up mt-4 flex items-center justify-between">
        <p className="text-xs tracking-[0.08em] text-white/35">GROUP MEMBERS</p>
        <div className="flex items-center gap-2">
          <GhostButton disabled={!canRemoveMember} label="Remove" onClick={onRemoveMember} />
          <GhostButton disabled={!canAddMember} label="Add Member" onClick={onAddMember} />
        </div>
      </div>

      <div className="anim-fade-up mt-2 flex-1 space-y-2 overflow-y-auto pr-1">
        {turns.map((turn) => (
          <Panel className="flex items-center gap-3 p-3" key={turn.member.id}>
            <span className="flex size-11 items-center justify-center rounded-[12px] bg-white/5 text-2xl">
              {turn.member.emoji}
            </span>

            <div className="min-w-0 flex-1">
              <label className="sr-only" htmlFor={`member-name-${turn.member.id}`}>
                Member name
              </label>
              <input
                className="h-10 w-full rounded-[10px] border border-white/10 bg-[#0e0e0e] px-3 text-sm text-white placeholder:text-white/35 focus:border-[#ff6b00] focus:outline-none"
                id={`member-name-${turn.member.id}`}
                maxLength={20}
                onChange={(event) => onMemberNameChange(turn.member.id, event.target.value)}
                value={turn.member.name}
              />
              <p className="mt-1 text-xs text-white/35">
                Turn {turn.memberIndex + 1}: {turn.durationSec}s sing + {turn.previewSec.toFixed(1)}s preview
              </p>
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="anim-fade-up mt-4 border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.08)]">
        <p className="text-xs text-white/45">FLOW ORDER</p>
        <p className="mt-1 text-sm leading-6 text-white/70">
          Instruction to 3 second countdown to member order reveal to preview to sing to pass.
        </p>
      </Panel>

      <div className="anim-fade-up mt-4">
        <PrimaryButton label="Start Round" onClick={onStartRound} />
      </div>
    </FlowShell>
  );
}
