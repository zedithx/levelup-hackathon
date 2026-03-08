/**
 * Mission scripts for all 4 checkpoints. All mascots share the same content
 * (they are all called Pingo) but differ only in their intro SFX.
 *
 * Checkpoint ↔ image-target index mapping:
 *   0 → balcony    (Mission 3 – The Piano Balcony,    Level 4)
 *   1 → butt       (Mission 4 – The Monster Pile,     Level 4)
 *   2 → butterfly  (Mission 2 – The Studio Butterfly, Level 3)
 *   3 → car        (Mission 1 – The Robot Ride,       Basement 1)
 */

export type CheckpointPhase = {
  /** Mascot briefing shown while the player hunts for the checkpoint image */
  intro: string;
  /** Mascot reaction the moment the image target is matched */
  found: string;
  /** Challenge instruction (selfie / dance / sing / draw) */
  challenge: string;
  /** Victory line + riddle leading to the next checkpoint */
  success: string;
};

export type MascotScript = {
  mascotName: string;
  /** Human-readable SFX cue for the intro line */
  introSfx: string;
  checkpoints: {
    car: CheckpointPhase;        // Image 3 – Checkpoint 1
    butterfly: CheckpointPhase;  // Image 2 – Checkpoint 2
    balcony: CheckpointPhase;    // Image 0 – Checkpoint 3
    butt: CheckpointPhase;       // Image 1 – Checkpoint 4
  };
};

/** Maps the MindAR target index → checkpoint key */
export const TARGET_INDEX_TO_CHECKPOINT: Record<number, keyof MascotScript["checkpoints"]> = {
  3: "car",
  2: "butterfly",
  0: "balcony",
  1: "butt",
};

// Shared mission content — all mascots are Pingo, same script regardless of animal skin.
const SHARED_CHECKPOINTS: MascotScript["checkpoints"] = {
  car: {
    // Mission 1: The Robot Ride (Basement 1)
    intro:
      "Go all the way down to B1. Find the white car with the orange robot arm sitting on the checkered floor.",
    found:
      "Target spotted! You found the weirdest car in Somerset.",
    challenge:
      "Time for a squad photo! Get in the frame with this robotic beast and take a selfie!",
    success:
      "Epic! That's a wrap. You just earned +500 XP!",
  },
  butterfly: {
    // Mission 2: The Studio Butterfly (Level 3)
    intro:
      "Head up to Level 3. Search near the dance mirrors for the red smiling butterfly that lives on the wall.",
    found:
      "You found it! This is where the K-Pop magic happens.",
    challenge:
      "Main character moment! Record a 10-second dance in front of the mirrors—show me your best moves!",
    success:
      "SICK MOVES! You've officially earned the 'Trendsetter' status!",
  },
  balcony: {
    // Mission 3: The Piano Balcony (Level 4)
    intro:
      "Ascend to Level 4. Find the balcony with the great city view and the piano painted on the floor.",
    found:
      "What a view! This is the perfect spot for a little performance.",
    challenge:
      "Listen to the jingle... now sing it back into the mic as loud as you can!",
    success:
      "Awoo! You guys hit those high notes perfectly. 'Golden Vocals' prize secured!",
  },
  butt: {
    // Mission 4: The Monster Pile (Level 4)
    intro:
      "Stay on Level 4. Find the wall of colorful monsters—look for the big blue one showing off!",
    found:
      "Whoa! You found the monster horde. They look like they need a new friend.",
    challenge:
      "Let's get creative! Draw your own monster on the screen and add it to the pile!",
    success:
      "MISSION COMPLETE! That drawing is a masterpiece. You are now a 'Master Artist'!",
  },
};

export const MASCOT_SCRIPTS: Record<"dog" | "pig" | "chicken", MascotScript> = {
  dog:     { mascotName: "Pingo", introSfx: "Rapid tail thumping + Excited \"Woof!\"",          checkpoints: SHARED_CHECKPOINTS },
  pig:     { mascotName: "Pingo", introSfx: "High-pitched \"Oink!\" + Satisfied snuffling",      checkpoints: SHARED_CHECKPOINTS },
  chicken: { mascotName: "Pingo", introSfx: "Chaotic wing flapping + Sudden \"BA-GOCK!\"",       checkpoints: SHARED_CHECKPOINTS },
};
