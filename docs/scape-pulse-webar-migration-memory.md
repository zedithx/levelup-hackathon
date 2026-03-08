# Scape Pulse Legacy Memory (Before WebAR Removal)

Original targets requested:
- `AGENTS.md`
- `components/scape-pulse/mindar-image-scene.tsx`
- `components/scape-pulse/scape-pulse-flow.tsx`

Current workspace location observed:
- `deprecated/AGENTS.md`
- `deprecated/mindar-image-scene.tsx`
- `deprecated/scape-pulse-flow.tsx`

## AGENTS Rule
- JSX apostrophes must be escaped as `&apos;`.

## mindar-image-scene.tsx (legacy AR wrapper)

### Public API
- `MindARImageScene` props:
  - `targetMindFileSrc: string`
  - `scanningEnabled: boolean`
  - `onTargetFound: () => void`
  - `onArReadyChange?: (isReady: boolean) => void`

### Behavior
- Lazy-loads `aframe` + MindAR image modules once via a module-level bootstrap promise.
- Creates an `<a-scene>` with `mindar-image` attributes using `targetMindFileSrc`.
- Patches MindAR system methods (`stop`, `pause`, `unpause`) to avoid teardown/start race crashes.
- Emits readiness through `arReady` / `arError` events via `onArReadyChange`.
- First effect start sequence:
  - starts MindAR system once
  - then toggles pause/unpause based on `scanningEnabled`
- Binds `targetFound` listener on `a-entity mindar-image-target="targetIndex: 0"` and calls `onTargetFound`.
- UI states:
  - loading bootstrap view
  - error view
  - camera loading overlay while AR not ready

## scape-pulse-flow.tsx (legacy flow controller + UI)

### Top-level exported entry
- `export function ScapePulseFlow()`

### Flow state machine
- Screen union:
  - `intro-1`, `intro-2`, `intro-3`, `intro-4`
  - `class-code`
  - `profile`
  - `handoff`
  - `lobby`
  - `camera-permission`
  - `ar-race`
  - `checkpoint-cleared`

### Key data models
- `TeamMember` (id, avatar, name, role, isLeader?)
- `RaceDialogueStep` (id, speaker, message, ctaLabel)
- `RaceFlowConfig`:
  - mascot + checkpoint metadata
  - dialogue sequence

### Critical behavior to preserve in WebAR migration
- Onboarding progression 1 -> 4 -> class code.
- Class code validation gate (`PULSE1`) before profile.
- Profile seeds gamemaster identity + lobby team setup.
- Lobby requires at least 2 members before enabling race start.
- Camera permission step:
  - explicit `navigator.mediaDevices.getUserMedia` request
  - environment-facing preference
  - clear user-facing permission errors
- AR race step (`RaceCameraScreen`):
  - uses `MindARImageScene`
  - gating logic: target match only counts when AR is ready AND dialogue is complete
  - dialogue overlay advances with CTA until scanning unlocks
- Checkpoint matched route moves to `checkpoint-cleared`, then back to lobby.

### Internal reusable UI components in this file
- `BrandBar`, `ProgressDots`, `PrimaryButton`
- `OnboardingScreen`, `ClassCodeScreen`, `ProfileScreen`, `HandoffScreen`, `LobbyScreen`
- `CameraPermissionScreen`, `RaceCameraScreen`, `CheckpointClearedScreen`

## WebAR replacement notes
- Keep the same callback contract between race screen and AR scene:
  - readiness callback (`onArReadyChange`-like)
  - target matched callback (`onTargetFound`-like)
  - externally controlled scan enable flag (`scanningEnabled`-like)
- Preserve flow transitions and user-facing copy for camera errors and race gating.
- Preserve placeholder/target configurability currently exposed in camera-permission screen.
