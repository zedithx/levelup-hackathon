# Bug Log

Use this format for every new bug:

## [YYYY-MM-DD] Short Title
- Bug Error: `<exact error message or symptom>`
- Resolution Method: `<what was changed to fix it>`

---

## [2026-03-09] ScapePulse hook order build failure
- Bug Error: `React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render.`
- Resolution Method: Moved the `saveSharedTeamParticipants` `useEffect` above the hydration early return in `ScapePulseFlow` so hooks are always executed in a stable order.

## [2026-03-09] Missing useEffect dependency warning
- Bug Error: `React Hook useEffect has a missing dependency: 'setScreen'.`
- Resolution Method: Added `setScreen` to the dependency array of the handoff timeout effect in `ScapePulseFlow`.

## [2026-03-09] Singing flow prop type mismatch
- Bug Error: `Type '{ onComplete: () => void; }' is not assignable to type 'IntrinsicAttributes'. Property 'onComplete' does not exist...`
- Resolution Method: Added `SingingGameFlowProps` with optional `onComplete` and updated `SingingGameFlow` to accept it.
