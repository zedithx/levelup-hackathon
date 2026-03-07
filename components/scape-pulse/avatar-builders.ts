// Shared Three.js animal avatar builders used by the character customiser and AR guide.
// Call ensureThree() and await it before calling buildAnimalAvatar().

/* eslint-disable @typescript-eslint/no-explicit-any */
let THREE: any = null;
let _threeLoad: Promise<void> | null = null;

export function ensureThree(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!_threeLoad) {
    _threeLoad = import("three").then((m) => { THREE = m; });
  }
  return _threeLoad;
}

export type AnimalType = "pig" | "dog" | "chicken";

export interface AvatarConfig {
  animal: AnimalType;
  bodyColor: string;
  accentColor: string;
  eyeColor: string;
  markingColor: string;
}

export const ANIMAL_DEFAULTS: Record<AnimalType, Omit<AvatarConfig, "animal">> = {
  pig:     { bodyColor: "#f5b8c4", accentColor: "#e07890", eyeColor: "#1a0a0a", markingColor: "#e890b8" },
  dog:     { bodyColor: "#d4a060", accentColor: "#e8c890", eyeColor: "#2a1608", markingColor: "#8b4a18" },
  chicken: { bodyColor: "#f5d855", accentColor: "#f07700", eyeColor: "#1a1a08", markingColor: "#cc1800" },
};

export const ANIMAL_PALETTES: Record<AnimalType, { body: string[]; accent: string[]; eye: string[]; marking: string[]; accentLabel: string; markingLabel: string }> = {
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

export const EMOJI_TO_ANIMAL: Record<string, AnimalType> = {
  "🐷": "pig",
  "🐶": "dog",
  "🐔": "chicken",
};

function avatarMat(color: string, roughness = 0.75, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness, metalness });
}

function makeMeshAdder(group: any) {
  return (
    geo: any, material: any,
    x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0,
  ) => {
    const m = new THREE.Mesh(geo, material);
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

export function buildAnimalAvatar(c: AvatarConfig): any {
  let group: any;
  switch (c.animal) {
    case "pig":     group = buildPig(c);     break;
    case "dog":     group = buildDog(c);     break;
    case "chicken": group = buildChicken(c); break;
  }
  group.traverse((child: any) => { if (child.isMesh) child.castShadow = true; });
  return group;
}
