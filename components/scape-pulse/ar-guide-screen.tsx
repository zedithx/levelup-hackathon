"use client";

/**
 * ArGuideScreen – WebXR immersive-AR screen that renders the customised animal
 * avatar on the real-world floor and makes it smoothly lead the user like a guide.
 *
 * Requirements (free, no SDK):
 *   - Android Chrome 81+ (ARCore)
 *   - iOS Safari 16+ with WebXR enabled, or WebXR Viewer app
 *   - Falls back gracefully on unsupported devices
 *
 * How the "follow" works:
 *   Each animation frame the animal's target position is set to 1.8 m in front of
 *   the XR camera in the XZ plane (ground level). The model lerps toward that point
 *   at a small factor so movement is smooth.  It always faces the user so they can
 *   see its face while it leads them.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildAnimalAvatar, ensureThree, ANIMAL_SPEAKER, type AvatarConfig, type AnimalType } from "./avatar-builders";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Types ─────────────────────────────────────────────────────────────────────

type ArStatus = "checking" | "unsupported" | "idle" | "starting" | "active" | "error";

type Props = {
  config: AvatarConfig;
  onExit: () => void;
  onSkip: () => void;
  showConfetti?: boolean;
  checkpoint?: { name: string; hint: string };
};

// ── Confetti overlay ──────────────────────────────────────────────────────────

const CONFETTI_COLORS = ["#ff6b00", "#00d4ff", "#ff3399", "#ffd700", "#00ff88", "#ffffff"];

function ConfettiOverlay() {
  const pieces = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: `${(i * 1.7 + 3) % 100}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: `${(i * 0.08) % 3}s`,
      duration: `${2.5 + (i % 7) * 0.3}s`,
      size: `${7 + (i % 5) * 2}px`,
      isCircle: i % 3 !== 0,
    }))
  , []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            top: "-20px",
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? "50%" : "2px",
            animationName: "confetti-fall",
            animationDuration: p.duration,
            animationDelay: p.delay,
            animationTimingFunction: "ease-in",
            animationFillMode: "forwards",
          }}
        />
      ))}
    </div>
  );
}

// ── Dialogue & SFX ───────────────────────────────────────────────────────────

type SfxType =
  | "oink-snuffle" | "grunt" | "oinks"          // pig
  | "bark" | "tail-thump" | "panting" | "growl" | "bark-fade"  // dog
  | "bagock" | "peck" | "cluck" | "cluck-retreat"               // chicken
  | "clink";                                     // shared exit chime
type DialogueLine = { sfx: SfxType; text: string };

const ANIMAL_DIALOGUE: Record<AnimalType, DialogueLine[]> = {
  pig: [
    { sfx: "oink-snuffle", text: "Snort... is this thing on? Finally! A human with enough energy to actually move. I'm Pingo, and I'm here to make sure you don't just 'hang out'—we're here to win." },
    { sfx: "grunt",        text: "Check the map. We're heading to the belly of the beast. Basement Level 1. I heard there's a sweet ride parked down there that's worth more than a pile of truffles." },
    { sfx: "oinks",        text: "Don't just stand there like a ceramic piggy bank! Move those trotters and find that car. First one there gets the glory. Chop-chop, let's go!" },
    { sfx: "clink",        text: "" },
  ],
  dog: [
    { sfx: "tail-thump", text: "Scanning scent... Sniff, sniff... Found you! I'm Pingo, your tactical K9 for today's mission. You look like you can run — good, because we've got ground to cover and a leaderboard to climb!" },
    { sfx: "panting",    text: "Listen up, Recruit! *SCAPE is our territory today, but the first secret is buried deep. I'm picking up a metallic scent from the underground — way down in Basement 1." },
    { sfx: "growl",      text: "There's a legendary beast on wheels hiding down there. If you find it, you unlock the first piece of the puzzle. Don't let the other packs beat us to it. Let's hunt! WOO-HOOO!" },
    { sfx: "bark-fade",  text: "" },
  ],
  chicken: [
    { sfx: "bagock", text: "Bawk! Look alive! The sky isn't falling, but our ranking will be if you don't start moving! I'm Pingo, and I've got the intel you need." },
    { sfx: "peck",   text: "First objective is a deep-dive. We're going to the Basement. Why? Because that's where the 'cool' stuff is hidden, and I'm too aerodynamic for the stairs — you'll have to take point!" },
    { sfx: "cluck",  text: "Your target is a car. Big, shiny, and definitely not a coop. Find it in B1, scan the code, and prove you aren't just a flightless bird. FLAP TO IT!" },
    { sfx: "cluck-retreat", text: "" },
  ],
};

/** Dialogue used when returning to AR guide after a checkpoint is cleared. */
const POST_CHECKPOINT_DIALOGUE: Record<AnimalType, DialogueLine[]> = {
  pig:     [{ sfx: "grunt",    text: "Look at that unique specimen! My eye for style is never wrong. Now keep those trotters moving — the next checkpoint won't find itself!" }, { sfx: "clink", text: "" }],
  dog:     [{ sfx: "panting", text: "Look at that unique specimen! My eye for style is never wrong. Good work, Recruit — now back on the hunt!" }, { sfx: "bark-fade", text: "" }],
  chicken: [{ sfx: "bagock",  text: "Look at that unique specimen! My eye for style is never wrong. BAWK! Don't let it go to your head — we've got more checkpoints to crack!" }, { sfx: "cluck-retreat", text: "" }],
};

const FAREWELL_LINES: Record<AnimalType, string> = {
  pig: "Race you there! Try to keep up with these trotters.",
  dog: "Race you there, Recruit. Full sprint!",
  chicken: "BAWK! Race you there. Last one there buys corn!",
};

function playSfx(type: SfxType): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    const play = (freq0: number, freq1: number, duration: number, waveform: OscillatorType, gain: number, startAt = t) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = waveform;
      osc.frequency.setValueAtTime(freq0, startAt);
      osc.frequency.exponentialRampToValueAtTime(freq1, startAt + duration);
      g.gain.setValueAtTime(gain, startAt);
      g.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
      osc.start(startAt); osc.stop(startAt + duration);
    };
    switch (type) {
      // ── Pig ──────────────────────────────────────────────────────────────
      case "oink-snuffle": play(900, 380, 0.14, "sawtooth", 0.28); break;
      case "grunt":        play(180, 110, 0.22, "sine",     0.38); break;
      case "oinks":        play(750, 340, 0.11, "sawtooth", 0.25);
                           play(700, 320, 0.10, "sawtooth", 0.22, t + 0.19); break;
      // ── Dog ──────────────────────────────────────────────────────────────
      case "bark":         play(420, 200, 0.12, "square",   0.22); break;
      case "tail-thump":   // three low thumps + excited woof
                           play(90, 70, 0.10, "sine", 0.45);
                           play(90, 70, 0.10, "sine", 0.45, t + 0.14);
                           play(90, 70, 0.10, "sine", 0.45, t + 0.27);
                           play(480, 220, 0.14, "square", 0.28, t + 0.42); break;
      case "panting":      // two breathy whooshes
                           play(320, 180, 0.18, "sine", 0.18);
                           play(300, 160, 0.16, "sine", 0.16, t + 0.28); break;
      case "growl":        play(95, 75, 0.32, "sawtooth", 0.34); break;
      case "bark-fade":    play(440, 210, 0.13, "square", 0.26);
                           play(400, 190, 0.11, "square", 0.18, t + 0.22);
                           play(360, 170, 0.09, "square", 0.12, t + 0.40); break;
      // ── Chicken ──────────────────────────────────────────────────────────
      case "bagock":       // chaotic wing flaps then BA-GOCK
                           play(320, 480, 0.06, "sawtooth", 0.22);
                           play(340, 500, 0.05, "sawtooth", 0.20, t + 0.08);
                           play(360, 520, 0.06, "sawtooth", 0.22, t + 0.15);
                           play(800, 1400, 0.18, "triangle", 0.34, t + 0.26); break;
      case "peck":         // rapid short clicks
                           play(1100, 900, 0.04, "square", 0.30);
                           play(1050, 860, 0.04, "square", 0.28, t + 0.07);
                           play(1080, 880, 0.04, "square", 0.28, t + 0.14);
                           play(1100, 900, 0.04, "square", 0.30, t + 0.21); break;
      case "cluck":        play(600, 900, 0.08, "triangle", 0.20);
                           play(600, 880, 0.07, "triangle", 0.18, t + 0.12); break;
      case "cluck-retreat":// retreating bawk-bawk-bawk-ba-gock (descending volume)
                           play(700, 500, 0.09, "triangle", 0.28);
                           play(680, 480, 0.08, "triangle", 0.24, t + 0.14);
                           play(660, 460, 0.07, "triangle", 0.20, t + 0.27);
                           play(750, 1300, 0.18, "triangle", 0.22, t + 0.42); break;
      // ── Shared ───────────────────────────────────────────────────────────
      case "clink":        play(1800, 900, 0.35, "sine",    0.38); break;
    }
    setTimeout(() => ctx.close(), 1200);
  } catch { /* AudioContext may be blocked until a user gesture; fail silently */ }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Scale factor: the animal model is ~2 Three.js units tall; in AR 0.35 ≈ 70 cm */
const MODEL_SCALE = 0.35;
/** Distance in front of the camera (metres) where the animal targets */
const LEAD_DISTANCE = 3.5;
/** Lerp speed toward target each frame (lower = smoother / slower) */
const LERP_ALPHA = 0.03;
/** Fixed floor-arrow spawn distance from camera when guide mode starts */
const FLOOR_ARROW_DISTANCE = 1.8;
/** Fixed world direction for the floor arrow (0 = world +Z) */
const FLOOR_ARROW_YAW = 0;

// ── Component ─────────────────────────────────────────────────────────────────

export function ArGuideScreen({ config, onExit, onSkip, showConfetti = false, checkpoint }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const bobGroupRef = useRef<any>(null);
  const walkingAwayRef = useRef(false);
  const guideModeRef = useRef(false);
  const showFloorArrowRef = useRef(false);
  const avatarHiddenRef = useRef(false);
  const facingUserUntilRef = useRef(-1); // timestamp until pig faces user during a trigger // false = dialogue (face user), true = guide (back to user)

  const [status, setStatus] = useState<ArStatus>("checking");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);
  const [dialogueIndex, setDialogueIndex] = useState(-1);
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);
  const [isGuideMode, setIsGuideMode] = useState(false);
  const [poofActive, setPoofActive] = useState(false);
  const [farewellMsg, setFarewellMsg] = useState<string | null>(null);
  const poofTimeoutRef = useRef<number | null>(null);
  // Stable ref so the animation-loop closure can call setTriggerMsg without re-creating
  const setTriggerMsgRef = useRef(setTriggerMsg);

  // Check device support once on mount
  useEffect(() => {
    const xr = (navigator as any).xr;
    if (!xr) { setStatus("unsupported"); return; }
    xr.isSessionSupported("immersive-ar")
      .then((ok: boolean) => setStatus(ok ? "idle" : "unsupported"))
      .catch(() => setStatus("unsupported"));
  }, []);

  // Tear down XR if the component unmounts while a session is running
  useEffect(() => {
    return () => {
      rendererRef.current?.setAnimationLoop(null);
      sessionRef.current?.end().catch(() => {});
      if (poofTimeoutRef.current !== null) {
        window.clearTimeout(poofTimeoutRef.current);
        poofTimeoutRef.current = null;
      }
    };
  }, []);

  const startAR = useCallback(async () => {
    setStatus("starting");
    setErrorMsg(null);
    walkingAwayRef.current = false;
    guideModeRef.current = false;
    showFloorArrowRef.current = false;
    avatarHiddenRef.current = false;
    setIsGuideMode(false);

    try {
      await ensureThree();
      const THREE = await import("three");

      const canvas = canvasRef.current!;
      const overlay = overlayRef.current!;
      const xr = (navigator as any).xr;

      const session: any = await xr.requestSession("immersive-ar", {
        requiredFeatures: ["local-floor"],
        optionalFeatures: ["dom-overlay"],
        domOverlay: { root: overlay },
      });
      sessionRef.current = session;

      // ── Three.js renderer ────────────────────────────────────────────────
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      renderer.xr.setReferenceSpaceType("local-floor");
      await renderer.xr.setSession(session);
      rendererRef.current = renderer;

      // ── Scene ────────────────────────────────────────────────────────────
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);
      scene.add(camera);

      // Lighting designed for outdoor / bright indoor AR
      scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
      const sun = new THREE.DirectionalLight(0xffeedd, 1.0);
      sun.position.set(2, 5, 3);
      sun.castShadow = true;
      scene.add(sun);

      // ── Animal model ─────────────────────────────────────────────────────
      const animal = buildAnimalAvatar(config);
      animal.scale.setScalar(MODEL_SCALE);
      // Start hidden; shown once we have the first XR frame
      animal.visible = false;
      scene.add(animal);

      // Idle bob animation: animal gently bobs up and down while standing
      const bobGroup = new THREE.Group();
      scene.remove(animal);
      bobGroup.add(animal);
      animal.visible = true;
      scene.add(bobGroup);
      bobGroup.visible = false;
      bobGroupRef.current = bobGroup;

      // ── Fake shadow disc ─────────────────────────────────────────────────
      const shadowMesh = new THREE.Mesh(
        new THREE.CircleGeometry(0.28, 32),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }),
      );
      shadowMesh.rotation.x = -Math.PI / 2;
      scene.add(shadowMesh);

      // Floor arrow appears after dialogue ends; stays fixed in world space.
      const floorArrow = new THREE.Group();
      const arrowMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6b00,
        emissive: 0x3a1300,
        roughness: 0.55,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });
      const arrowShape = new THREE.Shape();
      arrowShape.moveTo(0, 0.58);
      arrowShape.lineTo(0.24, 0.2);
      arrowShape.lineTo(0.1, 0.2);
      arrowShape.lineTo(0.1, -0.58);
      arrowShape.lineTo(-0.1, -0.58);
      arrowShape.lineTo(-0.1, 0.2);
      arrowShape.lineTo(-0.24, 0.2);
      arrowShape.lineTo(0, 0.58);
      const arrowMesh = new THREE.Mesh(new THREE.ShapeGeometry(arrowShape), arrowMaterial);
      arrowMesh.rotation.x = -Math.PI / 2;
      arrowMesh.position.y = 0.012;
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.28, 0.34, 36),
        new THREE.MeshBasicMaterial({ color: 0xffa366, transparent: true, opacity: 0.75, side: THREE.DoubleSide }),
      );
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.006;
      floorArrow.add(arrowMesh, halo);
      floorArrow.visible = false;
      scene.add(floorArrow);

      // ── Animation state ──────────────────────────────────────────────────
      // Dialogue mode: screen-space offset (pig floats in front, faces user)
      const DIALOGUE_OFFSET = new THREE.Vector3(0, -0.3, -1.5);
      const targetPos       = new THREE.Vector3();
      const forward         = new THREE.Vector3();
      const _mat            = new THREE.Matrix4();
      let firstFrame        = true;
      let walkStartTime     = -1;
      let walkTargetX       = 0;
      let walkTargetZ       = 0;
      let floorArrowPlaced  = false;
      const WALK_DURATION   = 2.2;
      const TRIGGER_COOLDOWN = 8;
      let lastTriggerTime   = -TRIGGER_COOLDOWN;

      renderer.setAnimationLoop((_time: number, frame: any) => {
        if (!frame) return;

        const t      = performance.now() / 1000;
        const xrCam  = renderer.xr.getCamera();
        const camPos = xrCam.position;

        if (avatarHiddenRef.current) {
          bobGroup.visible = false;
          floorArrow.visible = false;
          shadowMesh.visible = false;
          renderer.render(scene, camera);
          return;
        }

        if (showFloorArrowRef.current && !floorArrowPlaced) {
          xrCam.getWorldDirection(forward);
          forward.y = 0;
          if (forward.lengthSq() < 0.0001) forward.set(0, 0, -1);
          forward.normalize();
          const arrowX = camPos.x + forward.x * FLOOR_ARROW_DISTANCE;
          const arrowZ = camPos.z + forward.z * FLOOR_ARROW_DISTANCE;
          floorArrow.position.set(arrowX, 0.01, arrowZ);
          floorArrow.rotation.set(0, FLOOR_ARROW_YAW, 0);
          floorArrow.visible = true;
          shadowMesh.visible = true;
          floorArrowPlaced = true;
        }

        // ── Walk-away mode ────────────────────────────────────────────────
        // Pig descends from floating position to floor and walks away, then
        // snaps back on the floor in front of the user (guide mode).
        if (walkingAwayRef.current) {
          if (walkStartTime < 0) {
            walkStartTime = t;
            // Walk target: 4 m ahead of user on the floor
            xrCam.getWorldDirection(forward);
            forward.y = 0;
            if (forward.lengthSq() < 0.0001) forward.set(0, 0, -1);
            forward.normalize();
            walkTargetX = camPos.x + forward.x * 4.0;
            walkTargetZ = camPos.z + forward.z * 4.0;
          }

          const elapsed = t - walkStartTime;
          const alpha   = Math.min(elapsed / WALK_DURATION, 1);

          // Move toward walk target; snap Y to floor immediately
          bobGroup.position.x += (walkTargetX - bobGroup.position.x) * 0.06;
          bobGroup.position.y  = 0;
          bobGroup.position.z += (walkTargetZ - bobGroup.position.z) * 0.06;

          // Back to user: look at camera then flip 180°
          bobGroup.lookAt(camPos.x, 0, camPos.z);
          bobGroup.rotateY(Math.PI);
          animal.position.y = Math.sin(t * 9) * 0.07 * (1 / MODEL_SCALE);
          animal.rotation.z = Math.sin(t * 9) * 0.08;

          if (alpha >= 1) {
            walkingAwayRef.current = false;
            walkStartTime = -1;
            animal.rotation.z = 0;
            // Snap pig to floor LEAD_DISTANCE ahead so lerp starts clean
            xrCam.getWorldDirection(forward);
            forward.y = 0;
            if (forward.lengthSq() < 0.0001) forward.set(0, 0, -1);
            forward.normalize();
            bobGroup.position.set(
              camPos.x + forward.x * LEAD_DISTANCE,
              0,
              camPos.z + forward.z * LEAD_DISTANCE,
            );
            bobGroup.visible = true;
          }

          shadowMesh.position.set(bobGroup.position.x, 0.001, bobGroup.position.z);
          renderer.render(scene, camera);
          return;
        }

        // ── Dialogue mode: screen-space float, face user ──────────────────
        if (!guideModeRef.current) {
          _mat.copy(xrCam.matrixWorld);
          targetPos.copy(DIALOGUE_OFFSET).applyMatrix4(_mat);

          if (firstFrame) {
            bobGroup.position.copy(targetPos);
            bobGroup.visible = true;
            firstFrame = false;
          } else {
            bobGroup.position.lerp(targetPos, LERP_ALPHA);
          }

          bobGroup.lookAt(camPos.x, bobGroup.position.y, camPos.z);
          animal.position.y = Math.sin(t * 2.4) * 0.04 * (1 / MODEL_SCALE);

          shadowMesh.position.set(bobGroup.position.x, 0.001, bobGroup.position.z);
          renderer.render(scene, camera);
          return;
        }

        // ── Guide mode: floor placement, back to user ─────────────────────
        xrCam.getWorldDirection(forward);
        forward.y = 0;
        if (forward.lengthSq() < 0.0001) forward.set(0, 0, -1);
        forward.normalize();

        // XZ lerp only — Y hard-set to 0 so pig is always on the floor
        bobGroup.position.x += (camPos.x + forward.x * LEAD_DISTANCE - bobGroup.position.x) * LERP_ALPHA;
        bobGroup.position.y  = 0;
        bobGroup.position.z += (camPos.z + forward.z * LEAD_DISTANCE - bobGroup.position.z) * LERP_ALPHA;

        // During a trigger: face user for 3 s, then resume back-to-user
        if (t < facingUserUntilRef.current) {
          bobGroup.lookAt(camPos.x, 0, camPos.z);
        } else {
          bobGroup.lookAt(camPos.x, 0, camPos.z);
          bobGroup.rotateY(Math.PI);
        }

        animal.position.y = Math.sin(t * 2.4) * 0.04 * (1 / MODEL_SCALE);
        shadowMesh.position.set(bobGroup.position.x, 0.001, bobGroup.position.z);

        // ── Distance-based meme triggers ─────────────────────────────────
        if (t - lastTriggerTime > TRIGGER_COOLDOWN) {
          const dist = bobGroup.position.distanceTo(camPos);
          const animalEmoji = config.animal === "pig" ? "🐷" : config.animal === "dog" ? "🐶" : "🐔";
          const hurryLines: Record<string, string[]> = {
            pig: [
              `${animalEmoji} Pingo: Oi! My trotters move faster than that — keep up!`,
              `${animalEmoji} Pingo: Don't just stare at my tail!`,
              `${animalEmoji} Pingo: Move those trotters — we're burning daylight!`,
              `${animalEmoji} Pingo: I didn't sign up to be a screensaver. MOVE.`,
            ],
            dog: [
              `${animalEmoji} Pingo: Come on, Recruit! I'm losing the scent waiting for you!`,
              `${animalEmoji} Pingo: Left paw, right paw — that's all it takes. MOVE IT!`,
              `${animalEmoji} Pingo: Other packs are already on the trail. Don't fall behind!`,
              `${animalEmoji} Pingo: I said HUNT, not HAUNT. Pick up the pace!`,
            ],
            chicken: [
              `${animalEmoji} Pingo: BAWK! My wings are faster than your legs — somehow!`,
              `${animalEmoji} Pingo: Don't be a sitting duck — FLAP TO IT!`,
              `${animalEmoji} Pingo: I crossed the road faster than you're crossing this floor!`,
              `${animalEmoji} Pingo: BA-GOCK! Are you molting or moving? MOVE!`,
            ],
          };
          const satisfiedLine: Record<string, string> = {
            pig:     `${animalEmoji} Pingo: *satisfied snuffle* Now we're talking.`,
            dog:     `${animalEmoji} Pingo: *happy panting* Good pace — I can smell victory!`,
            chicken: `${animalEmoji} Pingo: *approving cluck* NOW that's the pace! Keep flapping!`,
          };
          const hurrySfx: Record<string, SfxType> = { pig: "oinks", dog: "bark", chicken: "bagock" };
          const satisfiedSfx: Record<string, SfxType> = { pig: "grunt", dog: "panting", chicken: "cluck" };
          const animal = config.animal;
          if (dist > 3) {
            const lines = hurryLines[animal];
            setTriggerMsgRef.current(lines[Math.floor(Math.random() * lines.length)]);
            playSfx(hurrySfx[animal]);
            lastTriggerTime = t;
            facingUserUntilRef.current = t + 3;
          } else if (dist < 1.5) {
            setTriggerMsgRef.current(satisfiedLine[animal]);
            playSfx(satisfiedSfx[animal]);
            lastTriggerTime = t;
            facingUserUntilRef.current = t + 3;
          }
        }

        renderer.render(scene, camera);
      });

      session.addEventListener("end", () => {
        renderer.setAnimationLoop(null);
        // Dispose geometries + materials
        scene.traverse((child: any) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            child.material?.dispose();
          }
        });
        renderer.dispose();
        rendererRef.current = null;
        sessionRef.current = null;
        onExit();
      });

      setStatus("active");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Failed to start AR session");
      setStatus("error");
    }
  }, [config, onExit]);

  const stopAR = useCallback(() => {
    sessionRef.current?.end().catch(() => {});
  }, []);

  // When returning after a checkpoint, skip the pre-session screen and launch AR immediately
  useEffect(() => {
    if (showConfetti && status === "idle") startAR();
  }, [showConfetti, status, startAR]);

  // Show confetti for 3 s once AR becomes active after a checkpoint
  useEffect(() => {
    if (!showConfetti || status !== "active") return;
    setConfettiActive(true);
    const tid = setTimeout(() => setConfettiActive(false), 3000);
    return () => clearTimeout(tid);
  }, [showConfetti, status]);

  const activeDialogue = showConfetti ? POST_CHECKPOINT_DIALOGUE : ANIMAL_DIALOGUE;

  // Start first dialogue line when AR session becomes active
  useEffect(() => {
    if (status !== "active") return;
    const lines = activeDialogue[config.animal];
    if (!lines?.length) return;
    playSfx(lines[0].sfx);
    setDialogueIndex(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, config.animal]);

  // Handle the exit/clink line (text === "") — trigger walk-away in the XR loop
  useEffect(() => {
    if (dialogueIndex < 0) return;
    const lines = activeDialogue[config.animal];
    const line = lines?.[dialogueIndex];
    if (!line || line.text !== "") return;
    setFarewellMsg(`🐾 ${ANIMAL_SPEAKER[config.animal]}: ${FAREWELL_LINES[config.animal]}`);
    setPoofActive(true);
    if (poofTimeoutRef.current !== null) window.clearTimeout(poofTimeoutRef.current);
    poofTimeoutRef.current = window.setTimeout(() => {
      setPoofActive(false);
      setFarewellMsg(null);
      avatarHiddenRef.current = true;
      walkingAwayRef.current = false;
      guideModeRef.current = false;
      showFloorArrowRef.current = false;
      setIsGuideMode(false);
      setTriggerMsg(null);
      poofTimeoutRef.current = null;
    }, 900);
  }, [dialogueIndex, config.animal, activeDialogue]);

  const advanceDialogue = useCallback(() => {
    const lines = activeDialogue[config.animal];
    if (!lines) return;
    const next = dialogueIndex + 1;
    if (next >= lines.length) return;
    playSfx(lines[next].sfx);
    setDialogueIndex(next);
  }, [dialogueIndex, config.animal, activeDialogue]);

  // Auto-dismiss meme pop-up after 4 s
  useEffect(() => {
    if (!triggerMsg) return;
    const tid = setTimeout(() => setTriggerMsg(null), 4000);
    return () => clearTimeout(tid);
  }, [triggerMsg]);

  const currentLine = activeDialogue[config.animal]?.[dialogueIndex];
  const isLastTextLine =
    dialogueIndex >= 0 &&
    activeDialogue[config.animal]?.[dialogueIndex + 1]?.text === "";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-[100dvh] bg-[#050505]">
      {/* WebXR renders into this canvas; it goes full-screen when the session starts */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full"
        style={{ display: status === "active" ? "block" : "none" }}
      />

      {/* DOM overlay – visible on top of the AR camera feed */}
      <div ref={overlayRef} className="fixed inset-0 pointer-events-none z-10">
        {/* Confetti must live inside the domOverlay root to be composited by WebXR */}
        {confettiActive && <ConfettiOverlay />}
        {status === "active" && (
          <>
            {/* Speech bubble – shown while there is text to display */}
            {currentLine?.text ? (
              <div className="pointer-events-auto absolute top-10 inset-x-4 flex justify-center">
                <div className="relative w-full max-w-[360px] rounded-2xl border border-white/20 bg-black/80 px-5 py-4 shadow-2xl backdrop-blur-sm">
                  {/* Speaker label */}
                  <p className="mb-1.5 text-[0.65rem] font-bold tracking-[0.18em] text-[#ff6b00]">
                    {ANIMAL_SPEAKER[config.animal]}
                  </p>
                  {/* Dialogue text */}
                  <p className="text-sm leading-6 text-white/90">{currentLine.text}</p>
                  {/* Advance button */}
                  <button
                    className="mt-3 h-9 w-full rounded-xl bg-[rgba(255,107,0,0.15)] text-xs font-bold text-[#ff6b00] active:bg-[rgba(255,107,0,0.3)]"
                    onClick={advanceDialogue}
                    type="button"
                  >
                    {isLastTextLine ? "Let's go! →" : "Next →"}
                  </button>
                  {/* Tail pointing down toward the model on the floor */}
                  <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 h-0 w-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-black/80" />
                </div>
              </div>
            ) : null}

            {/* Distance-based meme pop-up (auto-dismisses) */}
            {triggerMsg ? (
              <div className="pointer-events-none absolute top-40 inset-x-0 flex justify-center px-6">
                <div className="rounded-full border border-white/20 bg-black/75 px-5 py-2 text-sm text-white/90 backdrop-blur-sm">
                  {triggerMsg}
                </div>
              </div>
            ) : null}

            {farewellMsg ? (
              <div className="pointer-events-none absolute top-24 inset-x-0 flex justify-center px-6">
                <div className="rounded-full border border-[#ff6b00]/40 bg-black/80 px-5 py-2 text-sm text-[#ffd9bf] backdrop-blur-sm">
                  {farewellMsg}
                </div>
              </div>
            ) : null}

            {poofActive ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-28 w-28">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff6b00]/90 animate-ping"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-28px)`,
                        animationDelay: `${i * 0.06}s`,
                        animationDuration: "0.55s",
                      }}
                    />
                  ))}
                  <span className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ff6b00]/70 bg-[#ff6b00]/15 animate-ping" />
                </div>
              </div>
            ) : null}

            {/* Checkpoint 1 reminder – visible throughout guide mode */}
            {isGuideMode && (
              <div className="pointer-events-none absolute top-6 inset-x-4 flex justify-center">
                <div className="w-full max-w-[360px] rounded-2xl border border-[#ff6b00]/30 bg-black/75 px-4 py-3 backdrop-blur-sm">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="text-[0.6rem] font-bold tracking-[0.18em] text-[#ff6b00]">{checkpoint?.name ?? "CHECKPOINT 1"}</p>
                    <div className="shrink-0 rounded-full bg-[#ff6b00] px-2 py-0.5 text-[0.6rem] font-bold text-white">
                      ACTIVE
                    </div>
                  </div>
                  <p className="text-[0.72rem] leading-5 text-white/70">{checkpoint?.hint ?? "Follow your guide to the destination"}</p>
                </div>
              </div>
            )}

            {/* Bottom controls – always visible once AR is active */}
            <div className="pointer-events-auto absolute bottom-8 inset-x-0 flex flex-col items-center gap-2 px-6">
              <button
                className="h-12 w-full max-w-[280px] rounded-2xl bg-[#ff6b00] font-bold text-white backdrop-blur-sm"
                onClick={() => { stopAR(); onSkip(); }}
                type="button"
              >
                I&apos;ve arrived at Checkpoint 1 →
              </button>
              <button
                className="h-10 w-full max-w-[280px] rounded-2xl bg-black/50 text-sm font-bold text-white/60 backdrop-blur-sm"
                onClick={stopAR}
                type="button"
              >
                EXIT AR
              </button>
            </div>
          </>
        )}
      </div>

      {/* Pre-session / fallback UI */}
      {status !== "active" && (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
          {/* Header */}
          <div className="mb-8 flex size-20 items-center justify-center rounded-3xl border border-[rgba(255,107,0,0.3)] bg-[rgba(255,107,0,0.1)]">
            <span className="text-4xl">
              {config.animal === "pig" ? "🐷" : config.animal === "dog" ? "🐶" : "🐔"}
            </span>
          </div>

          {status === "checking" && (
            <p className="text-sm text-white/40">Checking AR support…</p>
          )}

          {status === "unsupported" && (
            <>
              <p className="mb-2 font-display text-xl text-white">AR Not Available</p>
              <p className="mb-8 max-w-[300px] text-sm leading-6 text-white/50">
                WebXR AR requires Android Chrome or iOS Safari 16+. Try on a supported device.
              </p>
              <button
                className="mb-3 h-12 w-full max-w-[280px] rounded-2xl bg-[#ff6b00] font-bold text-white"
                onClick={onSkip}
                type="button"
              >
                I&apos;ve arrived at Checkpoint 1 →
              </button>
              <button
                className="h-10 w-full max-w-[280px] text-sm font-bold text-white/30"
                onClick={onExit}
                type="button"
              >
                Back
              </button>
            </>
          )}

          {(status === "idle" || status === "error") && (
            <>
              <h1 className="mb-3 font-display text-[clamp(1.8rem,8vw,2.2rem)] leading-none text-white">
                MEET YOUR GUIDE
              </h1>
              <p className="mb-8 max-w-[300px] text-sm leading-6 text-white/50">
                Your mascot will appear on the ground in front of you and lead the way to each checkpoint.
              </p>
              {errorMsg && (
                <p className="mb-4 rounded-xl border border-[#ff6b00]/30 bg-[rgba(255,107,0,0.1)] px-4 py-2 text-xs text-[#ffc69f]">
                  {errorMsg}
                </p>
              )}
              <button
                className="mb-3 h-[clamp(3rem,8vh,3.5rem)] w-full max-w-[320px] rounded-2xl bg-[#ff6b00] font-display text-lg tracking-wider text-white"
                onClick={startAR}
                type="button"
              >
                START AR GUIDE
              </button>
              <button
                className="mb-2 h-11 w-full max-w-[320px] rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white/70"
                onClick={onSkip}
                type="button"
              >
                I&apos;ve arrived at Checkpoint 1 →
              </button>
              <button
                className="h-10 w-full max-w-[320px] text-sm font-bold text-white/30"
                onClick={onExit}
                type="button"
              >
                Back
              </button>
            </>
          )}

          {status === "starting" && (
            <p className="text-sm text-white/40">Starting AR…</p>
          )}
        </div>
      )}
    </div>
  );
}





