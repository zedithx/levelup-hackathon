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

import { useCallback, useEffect, useRef, useState } from "react";
import { buildAnimalAvatar, ensureThree, type AvatarConfig, type AnimalType } from "./avatar-builders";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Types ─────────────────────────────────────────────────────────────────────

type ArStatus = "checking" | "unsupported" | "idle" | "starting" | "active" | "error";

type Props = {
  config: AvatarConfig;
  onExit: () => void;
};

// ── Dialogue & SFX ───────────────────────────────────────────────────────────

type SfxType = "oink-snuffle" | "grunt" | "oinks" | "bark" | "cluck" | "clink";
type DialogueLine = { sfx: SfxType; text: string };

const ANIMAL_DIALOGUE: Record<AnimalType, DialogueLine[]> = {
  pig: [
    { sfx: "oink-snuffle", text: "Snort... is this thing on? Finally! A human with enough energy to actually move. I'm Hamilton, and I'm here to make sure you don't just 'hang out'—we're here to win." },
    { sfx: "grunt",        text: "Check the map. We're heading to the belly of the beast. Basement Level 1. I heard there's a sweet ride parked down there that's worth more than a pile of truffles." },
    { sfx: "oinks",        text: "Don't just stand there like a ceramic piggy bank! Move those trotters and find that car. First one there gets the glory. Chop-chop, let's go!" },
    { sfx: "clink",        text: "" },
  ],
  dog: [
    { sfx: "bark",  text: "Woof! Stick close and keep moving — I know every shortcut. Let's track down that checkpoint!" },
    { sfx: "clink", text: "" },
  ],
  chicken: [
    { sfx: "cluck", text: "Bwok bwok! No time for pecking around — follow me and we'll reach the checkpoint before anyone else!" },
    { sfx: "clink", text: "" },
  ],
};

const ANIMAL_SPEAKER: Record<AnimalType, string> = {
  pig:     "HAMILTON 🐷",
  dog:     "REX 🐶",
  chicken: "CLUCKY 🐔",
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
      case "oink-snuffle": play(900, 380, 0.14, "sawtooth", 0.28); break;
      case "grunt":        play(180, 110, 0.22, "sine",     0.38); break;
      case "oinks":        play(750, 340, 0.11, "sawtooth", 0.25);
                           play(700, 320, 0.10, "sawtooth", 0.22, t + 0.19); break;
      case "bark":         play(420, 200, 0.12, "square",   0.22); break;
      case "cluck":        play(600, 900, 0.08, "triangle", 0.20);
                           play(600, 880, 0.07, "triangle", 0.18, t + 0.12); break;
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

// ── Component ─────────────────────────────────────────────────────────────────

export function ArGuideScreen({ config, onExit }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const bobGroupRef = useRef<any>(null);
  const walkingAwayRef = useRef(false);
  const guideModeRef = useRef(false);
  const facingUserUntilRef = useRef(-1); // timestamp until pig faces user during a trigger // false = dialogue (face user), true = guide (back to user)

  const [status, setStatus] = useState<ArStatus>("checking");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dialogueIndex, setDialogueIndex] = useState(-1);
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);
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
    };
  }, []);

  const startAR = useCallback(async () => {
    setStatus("starting");
    setErrorMsg(null);

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
      const WALK_DURATION   = 2.2;
      const TRIGGER_COOLDOWN = 8;
      let lastTriggerTime   = -TRIGGER_COOLDOWN;

      renderer.setAnimationLoop((_time: number, frame: any) => {
        if (!frame) return;

        const t      = performance.now() / 1000;
        const xrCam  = renderer.xr.getCamera();
        const camPos = xrCam.position;

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
          if (dist > 3) {
            const hurryLines = [
              "🐷 Oi! My trotters move faster than that — keep up!",
              "🐷 Don't just stare at my tail!",
              "🐷 Move those trotters — we're burning daylight!",
              "🐷 I didn't sign up to be a screensaver. MOVE.",
            ];
            setTriggerMsgRef.current(hurryLines[Math.floor(Math.random() * hurryLines.length)]);
            playSfx("oinks");
            lastTriggerTime = t;
            facingUserUntilRef.current = t + 3;
          } else if (dist < 1.5) {
            setTriggerMsgRef.current("🐷 *satisfied snuffle* Now we're talking.");
            playSfx("grunt");
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

  // Start first dialogue line when AR session becomes active
  useEffect(() => {
    if (status !== "active") return;
    const lines = ANIMAL_DIALOGUE[config.animal];
    if (!lines?.length) return;
    playSfx(lines[0].sfx);
    setDialogueIndex(0);
  }, [status, config.animal]);

  // Handle the exit/clink line (text === "") — trigger walk-away in the XR loop
  useEffect(() => {
    if (dialogueIndex < 0) return;
    const lines = ANIMAL_DIALOGUE[config.animal];
    const line = lines?.[dialogueIndex];
    if (!line || line.text !== "") return;
    walkingAwayRef.current = true;
    guideModeRef.current = true;
  }, [dialogueIndex, config.animal]);

  const advanceDialogue = useCallback(() => {
    const lines = ANIMAL_DIALOGUE[config.animal];
    if (!lines) return;
    const next = dialogueIndex + 1;
    if (next >= lines.length) return;
    playSfx(lines[next].sfx);
    setDialogueIndex(next);
  }, [dialogueIndex, config.animal]);

  // Auto-dismiss meme pop-up after 4 s
  useEffect(() => {
    if (!triggerMsg) return;
    const tid = setTimeout(() => setTriggerMsg(null), 4000);
    return () => clearTimeout(tid);
  }, [triggerMsg]);

  const currentLine = ANIMAL_DIALOGUE[config.animal]?.[dialogueIndex];
  const isLastTextLine =
    dialogueIndex >= 0 &&
    ANIMAL_DIALOGUE[config.animal]?.[dialogueIndex + 1]?.text === "";

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

            {/* Exit button – always visible once AR is active */}
            <div className="pointer-events-auto absolute bottom-8 inset-x-0 flex justify-center px-6">
              <button
                className="h-12 w-full max-w-[280px] rounded-2xl bg-[rgba(255,107,0,0.85)] font-bold text-white backdrop-blur-sm"
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
                className="h-12 w-full max-w-[280px] rounded-2xl bg-white/10 text-sm font-bold text-white/60"
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
