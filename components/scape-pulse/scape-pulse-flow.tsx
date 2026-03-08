"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ASSETS } from "@/components/scape-pulse/flow/constants";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArGuideScreen } from "@/components/scape-pulse/ar-guide-screen";
import { ANIMAL_DEFAULTS } from "@/components/scape-pulse/avatar-builders";
import type { AnimalType, AvatarConfig } from "@/components/scape-pulse/avatar-builders";

import { ONBOARDING_SLIDES, RACE_FLOW_CONFIG } from "@/components/scape-pulse/flow/constants";
import { DanceFlow } from "@/components/dance-flow/dance-flow";
import { DrawingRelayFlow } from "@/components/drawing-game/drawing-relay-flow";
import { SelfieFlow } from "@/components/selfie-flow/selfie-flow";
import { SingingGameFlow } from "@/components/singing-game/singing-game-flow";
import { useEndingCarouselMedia } from "@/components/scape-pulse/flow/hooks/use-ending-carousel-media";
import { MASCOT_SCRIPTS, TARGET_INDEX_TO_CHECKPOINT } from "@/components/scape-pulse/flow/mascot-scripts";
import { CheckpointClearedScreen } from "@/components/scape-pulse/flow/screens/checkpoint-cleared-screen";
import { ClassCodeScreen } from "@/components/scape-pulse/flow/screens/class-code-screen";
import { FinalDestinationCarouselScreen } from "@/components/scape-pulse/flow/screens/final-destination-carousel-screen";
import { HandoffScreen } from "@/components/scape-pulse/flow/screens/handoff-screen";
import { LobbyScreen } from "@/components/scape-pulse/flow/screens/lobby-screen";
import { OnboardingScreen } from "@/components/scape-pulse/flow/screens/onboarding-screen";
import { ProfileScreen } from "@/components/scape-pulse/flow/screens/profile-screen";
import { RaceCameraScreen } from "@/components/scape-pulse/flow/screens/race-camera-screen";
import type { FlowScreen, TeamMember } from "@/components/scape-pulse/flow/types";

// Runtime Three.js + OrbitControls loaded dynamically to avoid SSR hydration mismatches
let THREE = null as any as Awaited<typeof import("three")>;
let OrbitControls = null as any as new (...a: any[]) => any;

let _threeLoad: Promise<void> | null = null;
function ensureThreeLocal(): Promise<void> {
  if (!_threeLoad) {
    _threeLoad = Promise.all([
      import("three"),
      import("three/addons/controls/OrbitControls.js"),
    ]).then(([m, { OrbitControls: OC }]) => {
      THREE = m;
      OrbitControls = OC;
    });
  }
  return _threeLoad;
}

// ── Avatar palette & emoji map (not in avatar-builders) ──────────────────────

const ANIMAL_PALETTES: Record<AnimalType, {
  body: string[]; accent: string[]; eye: string[]; marking: string[];
  accentLabel: string; markingLabel: string;
}> = {
  pig: {
    body:    ["#f5b8c4","#fadadd","#f5c5a3","#c8a0e0","#a8d8c8","#f5e0a0"],
    accent:  ["#e07890","#f0a8b8","#c05870","#ff6080","#d88080"],
    eye:     ["#1a0a0a","#3b2314","#1a3a1a","#5b8dd9","#8b4a8b","#cc2200"],
    marking: ["#e890b8","#d06090","#ff80c0","#c0a0e0","#e06060"],
    accentLabel: "Snout Colour", markingLabel: "Ear Colour",
  },
  dog: {
    body:    ["#d4a060","#c8884a","#e8d0a0","#ffffff","#4a3828","#b0a898"],
    accent:  ["#e8c890","#f0ddb0","#d4b880","#e8e0c8","#c8a878"],
    eye:     ["#1a0a0a","#3b2314","#1a3a1a","#5b8dd9","#8b4a8b","#cc2200"],
    marking: ["#8b4a18","#6a3010","#a06828","#4a2810","#c87830"],
    accentLabel: "Belly & Muzzle", markingLabel: "Saddle Colour",
  },
  chicken: {
    body:    ["#f5d855","#f0c040","#e8a820","#ffffff","#f0e090","#c8e8a0"],
    accent:  ["#f07700","#f05020","#e06010","#d08020","#f09040"],
    eye:     ["#1a0a0a","#3b2314","#1a3a1a","#5b8dd9","#8b4a8b","#cc2200"],
    marking: ["#cc1800","#dd3020","#bb0010","#ff4030","#aa1010"],
    accentLabel: "Beak & Leg Colour", markingLabel: "Comb & Wattle",
  },
};

const EMOJI_TO_ANIMAL: Record<string, AnimalType> = {
  "🐷": "pig",
  "🐶": "dog",
  "🐔": "chicken",
};

// ── Local Three.js build helpers (use module-level THREE singleton) ────────────

function avatarMat(color: string, roughness = 0.75, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness, metalness });
}

function makeMeshAdder(group: any) {
  return (
    geo: any, mat: any,
    x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0,
  ) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    group.add(m);
    return m;
  };
}

function buildPig(c: AvatarConfig): any {
  const g = new THREE.Group();
  const add = makeMeshAdder(g);
  const body = avatarMat(c.bodyColor), snoutM = avatarMat(c.accentColor, 0.8);
  const eyeM = avatarMat(c.eyeColor, 0.3), earM = avatarMat(c.markingColor);
  const hoof = avatarMat("#7a5050", 0.9), white = avatarMat("#ffffff", 0.3), dark = avatarMat("#0a0a0a", 0.1);
  add(new THREE.SphereGeometry(1, 32, 32), body, 0, 0.9, 0, 1.18, 0.86, 1.38);
  add(new THREE.CapsuleGeometry(0.34, 0.22, 5, 10), body, 0, 1.28, 0.58);
  add(new THREE.SphereGeometry(0.68, 28, 28), body, 0, 1.56, 0.96);
  for (const s of [-1, 1]) {
    add(new THREE.SphereGeometry(0.38, 12, 12), body, s * 0.46, 1.98, 0.76, 0.58, 1.32, 0.26);
    add(new THREE.SphereGeometry(0.26, 10, 10), earM, s * 0.46, 1.98, 0.80, 0.36, 0.92, 0.14);
  }
  add(new THREE.CylinderGeometry(0.36, 0.38, 0.18, 16), snoutM, 0, 1.36, 1.62, 1, 1, 1, Math.PI / 2);
  add(new THREE.SphereGeometry(0.085, 8, 8), avatarMat("#aa4858", 0.5), -0.14, 1.36, 1.77);
  add(new THREE.SphereGeometry(0.085, 8, 8), avatarMat("#aa4858", 0.5),  0.14, 1.36, 1.77);
  for (const s of [-1, 1]) {
    add(new THREE.SphereGeometry(0.13, 12, 12), white, s * 0.30, 1.62, 1.52, 1, 1, 0.52);
    add(new THREE.SphereGeometry(0.09, 10, 10), eyeM,  s * 0.30, 1.62, 1.59, 1, 1, 0.44);
    add(new THREE.SphereGeometry(0.055, 8, 8),  dark,  s * 0.30, 1.62, 1.63, 1, 1, 0.34);
    add(new THREE.SphereGeometry(0.028, 6, 6),  white, s * 0.34, 1.66, 1.64);
  }
  for (const [x, z] of [[-0.54, 0.64], [0.54, 0.64], [-0.54, -0.60], [0.54, -0.60]]) {
    add(new THREE.CapsuleGeometry(0.17, 0.42, 5, 10), body, x as number, 0.38, z as number);
    add(new THREE.SphereGeometry(0.20, 8, 8), hoof, x as number, 0.02, z as number, 1, 0.42, 0.88);
  }
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.066, 8, 16, Math.PI * 1.5), body);
  tail.position.set(0, 0.96, -1.30); tail.rotation.set(Math.PI / 4, 0, 0); tail.castShadow = true; g.add(tail);
  return g;
}

function buildDog(c: AvatarConfig): any {
  const g = new THREE.Group();
  const add = makeMeshAdder(g);
  const fur = avatarMat(c.bodyColor), belly = avatarMat(c.accentColor, 0.8);
  const saddle = avatarMat(c.markingColor), eyeM = avatarMat(c.eyeColor, 0.3);
  const noseM = avatarMat("#1a0a08", 0.4), white = avatarMat("#ffffff", 0.3);
  const dark = avatarMat("#0a0a0a", 0.1), tongue = avatarMat("#e84060", 0.7);
  add(new THREE.SphereGeometry(1, 32, 32), fur, 0, 0.86, 0, 1.15, 0.82, 1.45);
  add(new THREE.SphereGeometry(0.70, 16, 16), belly, 0, 0.64, 0.72, 0.76, 0.54, 0.58);
  add(new THREE.SphereGeometry(0.62, 14, 14), saddle, 0, 1.22, -0.28, 0.9, 0.52, 0.82);
  add(new THREE.CapsuleGeometry(0.36, 0.24, 5, 10), fur, 0, 1.36, 0.54);
  add(new THREE.SphereGeometry(0.70, 28, 28), fur, 0, 1.68, 0.88);
  add(new THREE.SphereGeometry(0.38, 16, 16), belly, 0, 1.52, 1.50, 1, 0.72, 0.88);
  add(new THREE.SphereGeometry(0.12, 10, 10), noseM, 0, 1.58, 1.86, 1, 0.75, 0.72);
  add(new THREE.SphereGeometry(0.11, 8, 8), tongue, 0, 1.38, 1.72, 0.72, 0.52, 0.52);
  for (const s of [-1, 1]) {
    add(new THREE.SphereGeometry(0.36, 12, 12), fur,   s * 0.72, 1.60, 0.74, 0.40, 1.32, 0.28);
    add(new THREE.SphereGeometry(0.24, 10, 10), belly, s * 0.72, 1.60, 0.78, 0.26, 0.88, 0.16);
  }
  for (const s of [-1, 1]) {
    add(new THREE.SphereGeometry(0.13, 12, 12), white, s * 0.34, 1.76, 1.46, 1, 1, 0.52);
    add(new THREE.SphereGeometry(0.09, 10, 10), eyeM,  s * 0.34, 1.76, 1.52, 1, 1, 0.44);
    add(new THREE.SphereGeometry(0.056, 8, 8),  dark,  s * 0.34, 1.76, 1.56, 1, 1, 0.34);
    add(new THREE.SphereGeometry(0.028, 6, 6),  white, s * 0.37, 1.80, 1.57);
  }
  for (const [x, z] of [[-0.52, 0.64], [0.52, 0.64], [-0.52, -0.64], [0.52, -0.64]]) {
    add(new THREE.CapsuleGeometry(0.18, 0.44, 5, 10), fur, x as number, 0.38, z as number);
    add(new THREE.SphereGeometry(0.21, 8, 8), fur, x as number, 0.02, z as number, 1.15, 0.40, 1.10);
  }
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.075, 8, 18, Math.PI * 1.2), fur);
  tail.position.set(0, 1.02, -1.38); tail.rotation.set(-Math.PI / 6, 0, 0); tail.castShadow = true; g.add(tail);
  return g;
}

function buildChicken(c: AvatarConfig): any {
  const g = new THREE.Group();
  const add = makeMeshAdder(g);
  const feather = avatarMat(c.bodyColor), beak = avatarMat(c.accentColor, 0.8);
  const comb = avatarMat(c.markingColor), eyeM = avatarMat(c.eyeColor, 0.3);
  const white = avatarMat("#ffffff", 0.3), dark = avatarMat("#0a0a0a", 0.1);
  add(new THREE.SphereGeometry(0.9, 32, 32), feather, 0, 1.05, 0, 1.05, 1.22, 1.28);
  add(new THREE.SphereGeometry(0.70, 18, 18), feather, 0, 0.98, 0.78, 0.82, 0.76, 0.72);
  add(new THREE.CapsuleGeometry(0.28, 0.18, 5, 10), feather, 0, 1.68, 0.44);
  add(new THREE.SphereGeometry(0.52, 24, 24), feather, 0, 1.94, 0.52);
  add(new THREE.ConeGeometry(0.12, 0.36, 8), beak, 0, 1.86, 1.02, 1, 1, 1, Math.PI / 2);
  add(new THREE.ConeGeometry(0.09, 0.26, 8), beak, 0, 1.74, 1.00, 1, 1, 1, Math.PI / 2 + 0.30);
  for (const [cy, cz, sy] of [[2.40, 0.66, 1.30], [2.46, 0.52, 1.55], [2.40, 0.38, 1.20]])
    add(new THREE.SphereGeometry(0.11, 8, 8), comb, 0, cy as number, cz as number, 0.80, sy as number, 0.80);
  add(new THREE.SphereGeometry(0.11, 8, 8), comb, -0.10, 1.68, 0.98, 0.80, 1.28, 0.72);
  add(new THREE.SphereGeometry(0.11, 8, 8), comb,  0.10, 1.68, 0.98, 0.80, 1.28, 0.72);
  for (const s of [-1, 1]) {
    add(new THREE.SphereGeometry(0.10, 12, 12), white, s * 0.32, 2.00, 0.92, 1, 1, 0.50);
    add(new THREE.SphereGeometry(0.07, 10, 10), eyeM,  s * 0.32, 2.00, 0.96, 1, 1, 0.44);
    add(new THREE.SphereGeometry(0.044, 8, 8),  dark,  s * 0.32, 2.00, 0.98, 1, 1, 0.35);
    add(new THREE.SphereGeometry(0.022, 6, 6),  white, s * 0.354, 2.034, 0.99);
  }
  for (const s of [-1, 1]) {
    add(new THREE.SphereGeometry(0.68, 16, 16), feather, s * 0.96, 1.06, -0.10, 0.36, 0.78, 1.14);
    add(new THREE.SphereGeometry(0.22, 10, 10), feather, s * 0.98, 0.76, -0.62, 0.60, 0.60, 0.60);
  }
  for (const s of [-1, 1]) {
    add(new THREE.CapsuleGeometry(0.076, 0.54, 5, 8), beak, s * 0.24, 0.44, 0.54);
    add(new THREE.SphereGeometry(0.09, 7, 7), beak, s * 0.24,        0.08, 0.76);
    add(new THREE.SphereGeometry(0.08, 7, 7), beak, s * 0.24 - 0.11, 0.08, 0.58);
    add(new THREE.SphereGeometry(0.08, 7, 7), beak, s * 0.24 + 0.11, 0.08, 0.58);
  }
  for (const [fx, frz] of [[0, 0], [-0.20, 0.36], [0.20, -0.36], [-0.38, 0.68], [0.38, -0.68]])
    add(new THREE.ConeGeometry(0.12, 0.62, 8), feather, fx as number, 1.20, -1.06, 1, 1, 1, -Math.PI / 3, 0, frz as number);
  return g;
}

function buildAnimalAvatarLocal(c: AvatarConfig): any {
  let group: any;
  switch (c.animal) {
    case "pig":     group = buildPig(c);     break;
    case "dog":     group = buildDog(c);     break;
    case "chicken": group = buildChicken(c); break;
  }
  group.traverse((child: any) => { if (child.isMesh) child.castShadow = true; });
  return group;
}

async function renderAvatarPreview(cfg: AvatarConfig): Promise<string> {
  await ensureThreeLocal();
  const w = 300, h = 300;
  const offCanvas = document.createElement("canvas");
  offCanvas.width = w; offCanvas.height = h;
  const r = new THREE.WebGLRenderer({ canvas: offCanvas, antialias: true });
  r.setPixelRatio(1); r.setSize(w, h, false);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.1;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  const s = new THREE.Scene();
  s.background = new THREE.Color("#0d0d1a");
  s.add(new THREE.HemisphereLight(0x8899cc, 0x664422, 0.45));
  const kl = new THREE.DirectionalLight(0xffeedd, 1.3);
  kl.position.set(4, 7, 5); kl.castShadow = true; s.add(kl);
  const fl = new THREE.DirectionalLight(0xaaccff, 0.4);
  fl.position.set(-5, 2, 3); s.add(fl);
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(4.5, 48),
    new THREE.MeshStandardMaterial({ color: 0x181828, roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.26; s.add(ground);
  const cam = new THREE.PerspectiveCamera(36, w / h, 0.1, 100);
  cam.position.set(1.8, 3.0, 7.5); cam.lookAt(0, 0.8, 0);
  s.add(buildAnimalAvatarLocal(cfg));
  r.render(s, cam);
  const url = offCanvas.toDataURL("image/png");
  s.traverse((child: unknown) => { const m = child as any; if (m.isMesh) { m.geometry.dispose(); (m.material as any).dispose(); } });
  r.dispose();
  return url;
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function ColorSelector({ title, colors, selectedColor, onSelectColor }: {
  title: string; colors: string[]; selectedColor: string; onSelectColor: (hex: string) => void;
}) {
  return (
    <div className="mb-4">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-white/30">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {colors.map((hex) => (
          <button
            key={hex}
            onClick={() => onSelectColor(hex)}
            type="button"
            className={cn(
              "size-9 rounded-full transition-all duration-200 border-2",
              selectedColor === hex
                ? "border-[#ff6b00] scale-110 shadow-[0_0_0_2px_#0a0a0a,0_0_0_4px_#ff6b00]"
                : "border-transparent hover:scale-105"
            )}
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
    </div>
  );
}

function BrandBar({ showSkip, onSkip }: { showSkip?: boolean; onSkip?: () => void }) {
  return (
    <header className="flex h-14 items-center justify-between px-5">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-[10px] bg-[#ff6b00]">
          <img alt="" className="size-4" src={ASSETS.logoZap} />
        </div>
        <p className="font-display text-[clamp(1rem,4.5vw,1.125rem)] leading-7 tracking-[0.045em]">
          <span className="text-[#ff6b00]">*SCAPE</span>
          <span className="text-white/20"> | </span>
          <span className="text-white/85">PULSE</span>
        </p>
      </div>
      {showSkip ? (
        <button className="text-sm font-bold text-white/30 transition-colors hover:text-white/60" onClick={onSkip} type="button">
          Skip
        </button>
      ) : null}
    </header>
  );
}

function PrimaryButton({ label, onClick, disabled, fullWidth = true }: {
  label: string; onClick: () => void; disabled?: boolean; fullWidth?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex h-[clamp(3.25rem,8vh,3.75rem)] items-center justify-center gap-2 rounded-2xl px-5 text-[clamp(1rem,4.5vw,1.125rem)] leading-7 tracking-[0.045em] transition-all duration-200 motion-safe:active:scale-[0.99] font-display",
        fullWidth ? "w-full" : "w-auto",
        disabled ? "bg-[rgba(255,107,0,0.3)] text-white/40" : "bg-[#ff6b00] text-white hover:bg-[#ff7e24]"
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

// ── Character selection screen ────────────────────────────────────────────────

function CharacterSelectionScreen({ onContinue }: { onContinue: (animal: AnimalType) => void }) {
  const [selected, setSelected] = useState<AnimalType>("pig");
  const [previews, setPreviews] = useState<Record<AnimalType, string>>({ pig: "", dog: "", chicken: "" });

  useEffect(() => {
    (["pig", "dog", "chicken"] as AnimalType[]).forEach((animal) => {
      renderAvatarPreview({ animal, ...ANIMAL_DEFAULTS[animal] }).then((url) => {
        setPreviews((prev) => ({ ...prev, [animal]: url }));
      });
    });
  }, []);

  const animalEmoji: Record<AnimalType, string> = { pig: "🐷", dog: "🐶", chicken: "🐔" };

  return (
    <div className="flex min-h-[100dvh] flex-col md:min-h-[852px]">
      <BrandBar />
      <div className="flex flex-1 flex-col px-5 pb-6 pt-4">
        <h1 className="mb-1 text-center font-display text-[clamp(1.6rem,7vw,2rem)] leading-none tracking-[0.03em] text-white">
          CHOOSE YOUR CHARACTER
        </h1>
        <p className="mb-6 text-center text-sm text-white/50">Pick a mascot for your adventure</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {(["pig", "dog", "chicken"] as AnimalType[]).map((animal) => (
            <button
              key={animal}
              onClick={() => setSelected(animal)}
              type="button"
              className={cn(
                "flex flex-col items-center rounded-2xl border-2 overflow-hidden transition-all duration-200",
                selected === animal
                  ? "border-[#ff6b00] bg-[rgba(255,107,0,0.1)] scale-[1.03]"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              )}
            >
              <div className="w-full overflow-hidden bg-[#0d0d1a]" style={{ aspectRatio: "1" }}>
                {previews[animal] ? (
                  <img alt={animal} className="w-full h-full object-cover" src={previews[animal]} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">{animalEmoji[animal]}</div>
                )}
              </div>
              <p className={cn("py-2 text-xs font-bold tracking-widest uppercase transition-colors", selected === animal ? "text-[#ff6b00]" : "text-white/40")}>
                {animal}
              </p>
            </button>
          ))}
        </div>

        <div className="flex-1" />
        <PrimaryButton label="Customise" onClick={() => onContinue(selected)} />
      </div>
    </div>
  );
}

// ── Character customise screen ────────────────────────────────────────────────

function CharacterCustomiseScreen({ selectedAvatar, onContinue }: {
  selectedAvatar: string; onContinue: (cfg: AvatarConfig) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animalType: AnimalType = EMOJI_TO_ANIMAL[selectedAvatar] ?? "pig";
  const palette = ANIMAL_PALETTES[animalType];
  const defaults = ANIMAL_DEFAULTS[animalType];

  const [bodyColor, setBodyColor] = useState(defaults.bodyColor);
  const [accentColor, setAccentColor] = useState(defaults.accentColor);
  const [eyeColor, setEyeColor] = useState(defaults.eyeColor);
  const [markingColor, setMarkingColor] = useState(defaults.markingColor);

  const rebuildRef = useRef<((cfg: AvatarConfig) => void) | null>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | null = null;

    ensureThreeLocal().then(() => {
      const canvas = canvasRef.current;
      if (disposed || !canvas) return;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#0d0d1a");

      // All animals span roughly y=0 (feet) to y=2.2 (ears/top).
      // Aim the camera at y=1.1 — the true vertical midpoint.
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 1.1, 5.5);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.target.set(0, 1.1, 0);
      controls.minDistance = 1.2;
      controls.maxDistance = 12;
      controls.update();

      scene.add(new THREE.HemisphereLight(0x8899cc, 0x664422, 0.45));
      const key = new THREE.DirectionalLight(0xffeedd, 1.3);
      key.position.set(4, 7, 5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xaaccff, 0.4);
      fill.position.set(-5, 2, 3); scene.add(fill);
      scene.add(new THREE.DirectionalLight(0xffffff, 0.28)).position.set(0, 5, -6);


      let avatarGroup = new THREE.Group();
      scene.add(avatarGroup);

      const fitAvatarToView = () => {
        const box = new THREE.Box3().setFromObject(avatarGroup);
        if (box.isEmpty()) return;

        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Fit using both vertical and horizontal FOV; keeps avatar centered on all aspect ratios.
        const vFov = THREE.MathUtils.degToRad(camera.fov);
        const hFov = 2 * Math.atan(Math.tan(vFov * 0.5) * camera.aspect);
        const fitHeight = (size.y * 0.5) / Math.tan(vFov * 0.5);
        const fitWidth = (size.x * 0.5) / Math.tan(hFov * 0.5);
        const distance = Math.max(fitHeight, fitWidth, size.z * 0.7) * 1.2;

        // Slight upward target bias keeps the body centered instead of appearing too high.
        const targetY = center.y + size.y * 0.06;
        controls.target.set(center.x, targetY, center.z);
        camera.position.set(center.x, targetY + size.y * 0.02, center.z + distance);

        controls.minDistance = Math.max(0.8, distance * 0.5);
        controls.maxDistance = distance * 2.5;
        camera.near = Math.max(0.01, distance / 100);
        camera.far = Math.max(50, distance * 10);
        camera.updateProjectionMatrix();
        controls.update();
      };

      rebuildRef.current = (cfg: AvatarConfig) => {
        scene.remove(avatarGroup);
        avatarGroup.traverse((child: any) => {
          if (child.isMesh) { child.geometry.dispose(); (child.material as any).dispose(); }
        });
        avatarGroup = buildAnimalAvatarLocal(cfg);
        scene.add(avatarGroup);
        fitAvatarToView();
      };

      rebuildRef.current({ animal: animalType, bodyColor, accentColor, eyeColor, markingColor });

      function resize() {
        const container = canvas!.parentElement;
        if (!container) return;
        renderer.setSize(container.clientWidth, container.clientHeight, false);
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        fitAvatarToView();
      }
      const ro = new ResizeObserver(resize);
      ro.observe(canvas.parentElement!);
      resize();

      let animId: number;
      function animate() {
        animId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      }
      animate();

      cleanup = () => {
        cancelAnimationFrame(animId);
        ro.disconnect();
        rebuildRef.current = null;
        controls.dispose();
        scene.traverse((child: any) => {
          if (child.isMesh) { child.geometry.dispose(); (child.material as any).dispose(); }
        });
        renderer.dispose();
      };
    });

    return () => { disposed = true; cleanup?.(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    rebuildRef.current?.({ animal: animalType, bodyColor, accentColor, eyeColor, markingColor });
  }, [animalType, bodyColor, accentColor, eyeColor, markingColor]);

  return (
    <div className="flex min-h-[100dvh] flex-col md:min-h-[852px]">
      <BrandBar />
      <div className="flex flex-1 flex-col px-5 pb-6 pt-2">
        <h1 className="mb-1 text-center font-display text-[clamp(1.6rem,7vw,2rem)] leading-none tracking-[0.03em] text-white">
          CHOOSE YOUR MASCOT
        </h1>
        <p className="mb-1 text-center text-sm text-white/50">Customise your mascot</p>
        <p className="mb-3 text-center text-xs text-white/25">Drag to rotate · Scroll to zoom</p>

        <div className="mb-4 mx-auto w-full max-w-[300px] aspect-square overflow-hidden rounded-2xl">
          <canvas ref={canvasRef} className="block w-full h-full" />
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          <ColorSelector title="BODY COLOUR" colors={palette.body} selectedColor={bodyColor} onSelectColor={setBodyColor} />
          <ColorSelector title={palette.accentLabel.toUpperCase()} colors={palette.accent} selectedColor={accentColor} onSelectColor={setAccentColor} />
          <ColorSelector title="EYE COLOUR" colors={palette.eye} selectedColor={eyeColor} onSelectColor={setEyeColor} />
          <ColorSelector title={palette.markingLabel.toUpperCase()} colors={palette.marking} selectedColor={markingColor} onSelectColor={setMarkingColor} />
        </div>

        <PrimaryButton
          label="LET'S GO!"
          onClick={() => onContinue({ animal: animalType, bodyColor, accentColor, eyeColor, markingColor })}
        />
      </div>
    </div>
  );
}

// ── Main flow component ───────────────────────────────────────────────────────

type CheckpointTransition = {
  checkpointName: string;
  foundMessage: string;
  challengeMessage: string;
  ctaLabel: string;
  nextScreen: FlowScreen;
};

const CHECKPOINT_TARGET_INDEX = {
  car: 3,
  butterfly: 2,
  monster: 1
} as const;

const CHECKPOINT_TRANSITIONS: Record<"ar-race" | "ar-race-dance" | "ar-race-drawing", CheckpointTransition> = {
  "ar-race": {
    checkpointName: "Mission 1: The Robot Ride",
    foundMessage: "Checkpoint locked in. Great find at the car station.",
    challengeMessage: "Selfie challenge unlocked. Gather your team and take the car group selfie now.",
    ctaLabel: "Start Selfie Challenge",
    nextScreen: "selfie"
  },
  "ar-race-dance": {
    checkpointName: "Mission 2: The Studio Butterfly",
    foundMessage: "Butterfly checkpoint confirmed. Nice work reaching the dance station.",
    challengeMessage: "Dance challenge unlocked. Record your butterfly dance performance.",
    ctaLabel: "Start Dance Challenge",
    nextScreen: "dance"
  },
  "ar-race-drawing": {
    checkpointName: "Mission 4: The Monster Pile",
    foundMessage: "Monster checkpoint confirmed. You made it to the drawing station.",
    challengeMessage: "Drawing challenge unlocked. Create your team monster artwork.",
    ctaLabel: "Start Drawing Challenge",
    nextScreen: "drawing"
  }
};

export function ScapePulseFlow() {
  const endingCarouselMedia = useEndingCarouselMedia();
  // ── Raw state (SSR-safe defaults) ──────────────────────────────────────────
  const [screenState, setScreenState] = useState<FlowScreen>("intro-1");
  const [avatarConfigState, setAvatarConfigState] = useState<AvatarConfig | null>(null);
  const [, setCheckpointClearedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // ── Restore from sessionStorage after hydration (client-only, runs once) ──
  useEffect(() => {
    try {
      const s = sessionStorage.getItem("pulse-screen") as FlowScreen | null;
      if (s) setScreenState(s);
      const a = sessionStorage.getItem("pulse-avatar");
      if (a) setAvatarConfigState(JSON.parse(a) as AvatarConfig);
      if (sessionStorage.getItem("pulse-checkpoint-cleared") === "1") setCheckpointClearedState(true);
    } catch { /* storage blocked */ }
    setHydrated(true);
  }, []);

  // ── Persisted setters – write to sessionStorage at call site, not in effects ──
  const setScreen = useCallback((s: FlowScreen) => {
    try { sessionStorage.setItem("pulse-screen", s); } catch {}
    setScreenState(s);
  }, []);

  const setAvatarConfig = useCallback((cfg: AvatarConfig | null) => {
    try { if (cfg) sessionStorage.setItem("pulse-avatar", JSON.stringify(cfg)); } catch {}
    setAvatarConfigState(cfg);
  }, []);

  const setCheckpointCleared = useCallback((v: boolean) => {
    try { sessionStorage.setItem("pulse-checkpoint-cleared", v ? "1" : "0"); } catch {}
    setCheckpointClearedState(v);
  }, []);

  // Aliases used by the rest of the component
  const screen = screenState;
  const avatarConfig = avatarConfigState;

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
  const [checkpointTransition, setCheckpointTransition] = useState<CheckpointTransition | null>(null);
  const [checkpointImagePlaceholder] = useState(
    RACE_FLOW_CONFIG.checkpoint.imagePlaceholderSrc
  );
  const [checkpointTargetMindSrc] = useState(
    RACE_FLOW_CONFIG.checkpoint.targetMindFileSrc
  );
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);

  /** RACE_FLOW_CONFIG merged with the player's chosen mascot at runtime. */
  const effectiveRaceConfig = useMemo(
    () => avatarConfig ? { ...RACE_FLOW_CONFIG, avatarConfig } : RACE_FLOW_CONFIG,
    [avatarConfig]
  );

  const activeAnimal = avatarConfig?.animal ?? "pig";
  const mascotScript = MASCOT_SCRIPTS[activeAnimal];
  const carPhase = mascotScript.checkpoints.car;
  const butterflyPhase = mascotScript.checkpoints.butterfly;
  const balconyPhase = mascotScript.checkpoints.balcony;
  const buttPhase = mascotScript.checkpoints.butt;

  const activeSlide = useMemo(
    () => ONBOARDING_SLIDES.find((slide) => slide.id === screen),
    [screen]
  );

  const classCodeValue = useMemo(() => classCodeChars.join(""), [classCodeChars]);
  const canJoinClass = classCodeValue === "PULSE1";

  const advanceOnboarding = () => {
    let next: FlowScreen = "class-code";
    if (screen === "intro-1") next = "intro-2";
    else if (screen === "intro-2") next = "intro-3";
    else if (screen === "intro-3") next = "intro-4";
    setScreen(next);
  };

  const updateCodeChar = (index: number, rawValue: string) => {
    const clean = rawValue.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    setClassCodeChars((prev) => {
      const next = [...prev];
      if (!clean) { next[index] = ""; return next; }
      if (clean.length === 1) {
        next[index] = clean;
      } else {
        clean.slice(0, 6 - index).split("").forEach((ch, i) => { next[index + i] = ch; });
      }
      return next;
    });
    if (clean.length > 1) { codeRefs.current[Math.min(index + clean.length, 5)]?.focus(); return; }
    if (clean && index < 5) codeRefs.current[index + 1]?.focus();
  };

  const pasteCodeChars = (index: number, pastedValue: string) => {
    const clean = pastedValue.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (!clean) return;
    setClassCodeChars((prev) => {
      const next = [...prev];
      clean.slice(0, 6 - index).split("").forEach((ch, i) => { next[index + i] = ch; });
      return next;
    });
    codeRefs.current[Math.min(index + clean.length, 5)]?.focus();
  };

  const focusPreviousCodeChar = (index: number) => {
    if (index <= 0) return;
    codeRefs.current[index - 1]?.focus();
    setClassCodeChars((prev) => { const next = [...prev]; next[index - 1] = ""; return next; });
  };

  const joinGame = () => { if (canJoinClass) setScreen("profile"); };

  const continueFromProfile = () => {
    const cleanName = playerName.trim() || "Jun";
    setPlayerName(cleanName);
    setSquadName(`Squad ${classCodeValue || "PULSE1"}`);
    setMembers([{ id: "member-gamemaster", avatar: selectedAvatar, name: cleanName, role: "Gamemaster", isLeader: true }]);
    setScreen("handoff");
  };

  const addTeammate = () => {
    const trimmedName = newTeammateName.trim();
    if (!trimmedName) return;
    setMembers((prev) => {
      const n = prev.filter((m) => m.role === "Teammate").length + 1;
      return [...prev, { id: `member-teammate-${n}`, avatar: newTeammateAvatar, name: trimmedName, role: "Teammate" }];
    });
    setExpandedAddTeammate(false);
    setNewTeammateName("");
  };

  const onCheckpointMatched = (targetIndex: number) => {
    const matched = TARGET_INDEX_TO_CHECKPOINT[targetIndex];

    if (screen === "ar-race" && matched !== "car") return;
    if (screen === "ar-race-dance" && matched !== "butterfly") return;
    if (screen === "ar-race-drawing" && matched !== "butt") return;

    if (screen === "ar-race") {
      setCheckpointTransition(CHECKPOINT_TRANSITIONS["ar-race"]);
    } else if (screen === "ar-race-dance") {
      setCheckpointTransition(CHECKPOINT_TRANSITIONS["ar-race-dance"]);
    } else if (screen === "ar-race-drawing") {
      setCheckpointTransition(CHECKPOINT_TRANSITIONS["ar-race-drawing"]);
    } else {
      return;
    }

    setCheckpointCleared(true);
    setScreen("checkpoint-cleared");
  };
  const clearSession = useCallback(() => {
    try {
      sessionStorage.removeItem("pulse-screen");
      sessionStorage.removeItem("pulse-avatar");
      sessionStorage.removeItem("pulse-checkpoint-cleared");
    } catch {}
  }, []);


  const resetFlow = useCallback(() => {
    clearSession();
    setScreenState("intro-1");
    setAvatarConfigState(null);
    setCheckpointClearedState(false);
    setClassCodeChars(Array.from({ length: 6 }, () => ""));
    setPlayerName("Jun");
    setSquadName("Squad PULSE1");
    setMembers([{ id: "member-jun", avatar: "🦊", name: "Jun", role: "Gamemaster", isLeader: true }]);
  }, [clearSession]);

  const backToLobby = () => setScreen("lobby");

  useEffect(() => {
    if (screen !== "handoff") return;
    const id = window.setTimeout(() => setScreen("lobby"), 3000);
    return () => window.clearTimeout(id);
  }, [screen]);

  // Wait for sessionStorage restore before rendering — prevents flash of intro-1
  if (!hydrated) {
    return <div className="min-h-[100dvh] bg-[#050505]" />;
  }

  const isIntroOrFinal = screen === "intro-1" || screen === "intro-2" || screen === "intro-3" || screen === "intro-4" || screen === "final-destination-carousel";

  return (
    <div className="anim-ambient-bg min-h-[100dvh] bg-[radial-gradient(circle_at_top,rgba(255,107,0,0.12),transparent_35%),#050505] md:px-6 md:py-8">
      {!isIntroOrFinal ? (
        <button
          className="fixed bottom-4 right-4 z-50 rounded-full border border-white/10 bg-[#0a0a0a]/80 px-3 py-1.5 text-[0.6rem] font-bold tracking-widest text-white/20 backdrop-blur-sm transition-colors hover:border-white/25 hover:text-white/50"
          onClick={resetFlow}
          type="button"
        >
          ↺ RESTART
        </button>
      ) : null}
      <main className="mx-auto min-h-[100dvh] w-full max-w-[393px] overflow-x-hidden bg-[#0a0a0a] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)] md:min-h-[852px] md:rounded-[24px]">
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
            onStartRace={() => setScreen("character-selection")}
            setExpandedAddTeammate={setExpandedAddTeammate}
            setNewTeammateAvatar={setNewTeammateAvatar}
            setNewTeammateName={setNewTeammateName}
            setSquadName={setSquadName}
            squadName={squadName}
          />
        ) : null}

        {screen === "character-selection" ? (
          <CharacterSelectionScreen
            onContinue={(animal) => {
              const emojiMap: Record<AnimalType, string> = { pig: "🐷", dog: "🐶", chicken: "🐔" };
              setSelectedAvatar(emojiMap[animal]);
              setScreen("mascot-selection");
            }}
          />
        ) : null}

        {screen === "mascot-selection" ? (
          <CharacterCustomiseScreen
            selectedAvatar={selectedAvatar}
            onContinue={(cfg) => {
              setAvatarConfig(cfg);
              setScreen("ar-guide");
            }}
          />
        ) : null}

        {/* AR guide: route to first station (car) using mascot script intro */}
        {screen === "ar-guide" && avatarConfig ? (
          <ArGuideScreen
            config={avatarConfig}
            showConfetti={false}
            checkpoint={{
              name: effectiveRaceConfig.checkpoint.name,
              hint: carPhase.intro[0],
            }}
            dialogueLines={carPhase.intro}
            onSkip={() => setScreen("ar-race")}
            onExit={() => setScreen("ar-race")}
          />
        ) : null}

        {/* Checkpoint scan: first station must be car (target index 3) */}
        {screen === "ar-race" ? (
          <RaceCameraScreen
            checkpointImagePlaceholder={checkpointImagePlaceholder}
            checkpointTargetMindSrc={checkpointTargetMindSrc}
            config={effectiveRaceConfig}
            expectedTargetIndex={CHECKPOINT_TARGET_INDEX.car}
            onBackToLobby={backToLobby}
            onCheckpointMatched={onCheckpointMatched}
          />
        ) : null}

        {/* Mascot congrats + challenge briefing before loading the station activity */}
        {screen === "checkpoint-cleared" ? (
          <CheckpointClearedScreen
            checkpointName={checkpointTransition?.checkpointName ?? effectiveRaceConfig.checkpoint.name}
            mascotName={effectiveRaceConfig.mascotName}
            foundMessage={checkpointTransition?.foundMessage ?? carPhase.found.join(" ")}
            challengeMessage={checkpointTransition?.challengeMessage ?? carPhase.challenge.join(" ")}
            ctaLabel={checkpointTransition?.ctaLabel ?? "Continue"}
            onContinue={() => {
              setScreen(checkpointTransition?.nextScreen ?? "selfie");
              setCheckpointTransition(null);
            }}
            onBackToLobby={backToLobby}
          />
        ) : null}

        {/* Station 1 activity: car selfie */}
        {screen === "selfie" ? (
          <SelfieFlow onComplete={() => setScreen("ar-guide-to-dance")} />
        ) : null}

        {/* Transition to butterfly dance checkpoint */}
        {screen === "ar-guide-to-dance" && avatarConfig ? (
          <ArGuideScreen
            config={avatarConfig}
            showConfetti={true}
            autoStart
            checkpoint={{
              name: "Mission 2: The Studio Butterfly",
              hint: butterflyPhase.intro[0],
            }}
            dialogueLines={[...carPhase.success, ...butterflyPhase.intro]}
            onSkip={() => setScreen("ar-race-dance")}
            onExit={() => setScreen("ar-race-dance")}
          />
        ) : null}

        {/* Checkpoint scan: butterfly station must match target index 2 */}
        {screen === "ar-race-dance" ? (
          <RaceCameraScreen
            checkpointImagePlaceholder={checkpointImagePlaceholder}
            checkpointTargetMindSrc={checkpointTargetMindSrc}
            config={{
              ...effectiveRaceConfig,
              checkpoint: {
                ...effectiveRaceConfig.checkpoint,
                name: "Mission 2: The Studio Butterfly"
              }
            }}
            expectedTargetIndex={CHECKPOINT_TARGET_INDEX.butterfly}
            onBackToLobby={backToLobby}
            onCheckpointMatched={onCheckpointMatched}
          />
        ) : null}

        {/* Station 2 activity: butterfly dance */}
        {screen === "dance" ? (
          <DanceFlow
            onComplete={() => setScreen("ar-guide-to-drawing")}
            onBack={() => setScreen("selfie")}
          />
        ) : null}

        {/* Transition to monster drawing checkpoint */}
        {screen === "ar-guide-to-drawing" && avatarConfig ? (
          <ArGuideScreen
            config={avatarConfig}
            showConfetti={true}
            autoStart
            checkpoint={{
              name: "Mission 4: The Monster Pile",
              hint: buttPhase.intro[0],
            }}
            dialogueLines={[...butterflyPhase.success, ...buttPhase.intro]}
            onSkip={() => setScreen("ar-race-drawing")}
            onExit={() => setScreen("ar-race-drawing")}
          />
        ) : null}

        {/* Checkpoint scan: monster station must match target index 1 */}
        {screen === "ar-race-drawing" ? (
          <RaceCameraScreen
            checkpointImagePlaceholder={checkpointImagePlaceholder}
            checkpointTargetMindSrc={checkpointTargetMindSrc}
            config={{
              ...effectiveRaceConfig,
              checkpoint: {
                ...effectiveRaceConfig.checkpoint,
                name: "Mission 4: The Monster Pile"
              }
            }}
            expectedTargetIndex={CHECKPOINT_TARGET_INDEX.monster}
            onBackToLobby={backToLobby}
            onCheckpointMatched={onCheckpointMatched}
          />
        ) : null}

        {/* Station 3 activity: monster drawing */}
        {screen === "drawing" ? (
          <DrawingRelayFlow onComplete={() => setScreen("ar-guide-to-singing")} />
        ) : null}

        {/* AR guide: leads to balcony singing station — uses balcony phase intro from mascot script */}
        {screen === "ar-guide-to-singing" && avatarConfig ? (
          <ArGuideScreen
            config={avatarConfig}
            showConfetti={true}
            autoStart
            checkpoint={{
              name: "Mission 3: The Piano Balcony",
              hint: balconyPhase.intro[0],
            }}
            dialogueLines={[...buttPhase.success, ...balconyPhase.intro]}
            onSkip={() => setScreen("singing")}
            onExit={() => setScreen("singing")}
          />
        ) : null}

        {/* Station 4 activity: balcony singing */}
        {screen === "singing" ? (
          <SingingGameFlow onComplete={() => setScreen("ar-guide-to-celebration")} />
        ) : null}

        {/* AR guide: all done — directs squad to the gallery for the celebratory finale */}
        {screen === "ar-guide-to-celebration" && avatarConfig ? (
          <ArGuideScreen
            config={avatarConfig}
            showConfetti={true}
            autoStart
            checkpoint={{
              name: "Grand Finale: The Gallery",
              hint: "Head to the gallery — your squad's memories are waiting for you!",
            }}
            dialogueLines={[
              ...balconyPhase.success,
              "Head to the gallery now — your squad's epic journey is immortalised there. Let's celebrate!",
            ]}
            onSkip={() => { clearSession(); setScreenState("final-destination-carousel"); }}
            onExit={() => { clearSession(); setScreenState("final-destination-carousel"); }}
          />
        ) : null}

        {screen === "final-destination-carousel" ? (
          <FinalDestinationCarouselScreen media={endingCarouselMedia} />
        ) : null}
      </main>
    </div>
  );
}











































