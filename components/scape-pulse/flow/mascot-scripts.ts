/**
 * Mission scripts for all 4 checkpoints. 
 * Restored to the long-form narrative style for maximum immersion.
 * * Checkpoint ↔ image-target index mapping:
 * 0 → balcony    (Mission 3 – The Piano Balcony,     Level 4)
 * 1 → butt       (Mission 4 – The Monster Pile,      Level 4)
 * 2 → butterfly  (Mission 2 – The Studio Butterfly, Level 3)
 * 3 → car        (Mission 1 – The Robot Ride,       Basement 1)
 */

export type CheckpointPhase = {
  intro: string;
  found: string;
  challenge: string;
  success: string;
};

export type MascotScript = {
  mascotName: string;
  introSfx: string;
  checkpoints: {
    car: CheckpointPhase;
    butterfly: CheckpointPhase;
    balcony: CheckpointPhase;
    butt: CheckpointPhase;
  };
};

export const TARGET_INDEX_TO_CHECKPOINT: Record<number, keyof MascotScript["checkpoints"]> = {
  3: "car",
  2: "butterfly",
  0: "balcony",
  1: "butt",
};

const SHARED_CHECKPOINTS: MascotScript["checkpoints"] = {
  car: {
    // Mission 1: The Robot Ride (Basement 1)
    intro:
      "Scanning biometrics... Found you! I’m Pingo, your tactical guide for today’s mission. You look like you can run—good, because we’ve got ground to cover and a leaderboard to climb! Listen up, Recruit! *SCAPE is our territory today, but the first secret is buried deep. I’m picking up a metallic scent from the underground—way down in Basement 1. There’s a legendary beast on wheels hiding down there on a checkered floor. Find it!",
    found:
      "Target acquired! You’ve sniffed out the metallic anomaly resting in the checkered depths. Not many make it this far down without getting lost in the code!",
    challenge:
      "This beast needs a record in our database. Align the squad, get in the frame, and pull your best 'Mission Accomplished' face for the selfie!",
    success:
      "EPIC SHOT! That’s +500 XP uploaded. But keep moving... I’m smelling a sweet nectar above. Head to Level 3. Search for the concrete garden where a red smile is frozen on silent wings near the mirrors.",
  },
  butterfly: {
    // Mission 2: The Studio Butterfly (Level 3)
    intro:
      "Ascend to the hall of reflections where the sky is made of mirrors! Search near the dance spaces for the silent gardener with crimson petals for wings who watches the performers but never leaves the wall. Don't be a chicken—Level 3 is waiting for you!",
    found:
      "Stop! Tactical objective reached! You found the grinning insect in the concrete jungle. My sensors are picking up some serious rhythm coming from these mirror-lined walls...",
    challenge:
      "This is the main stage! Form a triangle, stay in synchronized paws, and give me 10 seconds of pure main character energy for the camera!",
    success:
      "SICK MOVES! Sending that straight to the global archives. You’ve officially earned 'Trendsetter' status! Next, climb to the summit where the city touches the clouds. Find the balcony on Level 4 with the keys no finger can play.",
  },
  balcony: {
    // Mission 3: The Piano Balcony (Level 4)
    intro:
      "Look alive, Recruit! The sky isn't falling, but our ranking will be if we don't move! Locate the floor-piano resting at the very edge of the urban forest on the Level 4 balcony. It’s a deep-dive into the views, and you’ll have to take point!",
    found:
      "You made it to the ultimate VIP platform! Look at that panoramic view—it’s the perfect acoustic environment for what comes next.",
    challenge:
      "The wind is your only audience here. Listen to this Somerset jingle snippet... now I need the whole squad to howl it back into the mic with maximum volume!",
    success:
      "Awoo! Now that’s what I call a remix! You guys hit those high notes like absolute pros. 'Golden Vocals' prize secured! Final stop: Find the colorful monster horde hiding around the corner on Level 4.",
  },
  butt: {
    // Mission 4: The Monster Pile (Level 4)
    intro:
      "Venture to the forgotten corner where the colorful many show their true nature. Find the indigo moon leading a parade of eyes away from the light. Don't just stand there like a ceramic piggy bank—move those trotters and find that mural!",
    found:
      "Whoa, you actually tracked down the colorful horde! Careful—I think these monsters are mooning us. Let’s add to the chaos, shall we?",
    challenge:
      "We’re building a new 'Guardian of Scape.' Everyone take a turn sketching a piece of the monster on your screen—give it big teeth and maybe some sneakers!",
    success:
      "MISSION COMPLETE! That drawing is a masterpiece of chaos. You are now a 'Master Artist'! Let's check the final leaderboard and see if your squad took the crown!",
  },
};

export const MASCOT_SCRIPTS: Record<"dog" | "pig" | "chicken", MascotScript> = {
  dog: { 
    mascotName: "Pingo", 
    introSfx: "Rapid tail thumping + Excited \"Woof!\"", 
    checkpoints: SHARED_CHECKPOINTS 
  },
  pig: { 
    mascotName: "Pingo", 
    introSfx: "High-pitched \"Oink!\" + Satisfied snuffling", 
    checkpoints: SHARED_CHECKPOINTS 
  },
  chicken: { 
    mascotName: "Pingo", 
    introSfx: "Chaotic wing flapping + Sudden \"BA-GOCK!\"", 
    checkpoints: SHARED_CHECKPOINTS 
  },
};