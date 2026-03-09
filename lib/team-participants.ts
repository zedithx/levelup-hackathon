const TEAM_PARTICIPANTS_STORAGE_KEY = "levelup.team-participants.v1";

export type SharedTeamParticipant = {
  id: string;
  name: string;
  avatar: string;
};

type TeamParticipantInput = {
  id?: string;
  name?: string;
  avatar?: string;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTeamParticipants(value: unknown): SharedTeamParticipant[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const name = cleanString(record.name).slice(0, 24);

      if (!name) {
        return null;
      }

      return {
        avatar: cleanString(record.avatar).slice(0, 8),
        id: cleanString(record.id) || `member-${index + 1}`,
        name
      };
    })
    .filter((item): item is SharedTeamParticipant => Boolean(item));
}

export function readSharedTeamParticipants() {
  if (!isBrowser()) {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(TEAM_PARTICIPANTS_STORAGE_KEY) || "[]");
    return normalizeTeamParticipants(parsed);
  } catch {
    return [];
  }
}

export function saveSharedTeamParticipants(participants: TeamParticipantInput[]) {
  if (!isBrowser()) {
    return;
  }

  const nextParticipants = normalizeTeamParticipants(participants);
  window.localStorage.setItem(TEAM_PARTICIPANTS_STORAGE_KEY, JSON.stringify(nextParticipants));
}
