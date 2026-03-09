# Lint Playbook

Use this template for new recurring lint issues:

## Rule: `<eslint-rule-name>`
- Error Pattern: `<exact lint message>`
- Root Cause: `<why this usually happens>`
- Resolution Method: `<standard fix pattern>`
- Prevention: `<quick checklist before PR>`
- Example: `<file path:line>`

---

## Rule: `react/no-unescaped-entities`
- Error Pattern: `'<char>' can be escaped with &apos; ...`
- Root Cause: Raw apostrophes (or other reserved characters) are used directly inside JSX text nodes.
- Resolution Method: Escape the character in JSX text, e.g. `&apos;` for `'`, `&quot;` for `"`.
- Prevention: When writing copy in JSX, use escaped entities for apostrophes/quotes.
- Example: `components/...` text content like `Let's go` should be `Let&apos;s go`.

## Rule: `react-hooks/rules-of-hooks`
- Error Pattern: `React Hook "useEffect" is called conditionally.`
- Root Cause: A hook is placed after an early return or inside a conditional branch.
- Resolution Method: Move hooks to top-level component scope so they run in the same order every render.
- Prevention: Never place hooks after `if (...) return ...` guards.
- Example: `components/scape-pulse/scape-pulse-flow.tsx:786`

## Rule: `react-hooks/exhaustive-deps`
- Error Pattern: `React Hook useEffect has a missing dependency: 'x'.`
- Root Cause: A value/function used inside an effect is omitted from the dependency array.
- Resolution Method: Add missing dependencies, or wrap unstable callbacks in `useCallback` before use.
- Prevention: Treat dependency arrays as complete by default; justify and document intentional exceptions.
- Example: `components/scape-pulse/scape-pulse-flow.tsx:777`

## Rule: `@next/next/no-img-element`
- Error Pattern: `Using <img> could result in slower LCP and higher bandwidth...`
- Root Cause: Native `<img>` is used instead of optimized `next/image`.
- Resolution Method: Prefer `next/image`; only keep `<img>` when external constraints require it and lint is intentionally suppressed.
- Prevention: Use `Image` for new UI unless there is a specific technical reason not to.
- Example: `components/scape-pulse/scape-pulse-flow.tsx:283`
