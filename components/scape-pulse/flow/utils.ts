import type { CSSProperties } from "react";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function reveal(delayMs: number): CSSProperties {
  return { animationDelay: `${delayMs}ms` };
}
