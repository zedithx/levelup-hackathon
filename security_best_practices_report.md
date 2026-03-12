# Security Best Practices Report

## Executive Summary

Reviewed the current repository as a mixed Next.js 15 / React 19 frontend plus a small FastAPI backend. The most important issue is a public upload-signing endpoint that uses a Supabase service-role key without any visible authentication or abuse controls, which can be used to generate arbitrary signed uploads into a public bucket.

Update on 2026-03-13: `SEC-001` has been partially mitigated in code by adding a short-lived signed upload session cookie, same-origin checks, and request rate limiting around the signing route. `SEC-002` has also been partially mitigated by switching to an exact MIME allowlist, canonical storage content types, canonical server-chosen extensions, and lightweight file-signature checks in the browser. `SEC-003` has been addressed with a Next.js response-header baseline, `SEC-004` has been addressed by removing raw upload error details from client responses, and `SEC-005` has been mitigated by disabling FastAPI docs and the public DB health probe by default in production.

I did not find hardcoded secrets in tracked source files, and `.env` / `.env.local` are ignored in [.gitignore](.gitignore). I also did not find obvious DOM-XSS sinks such as `dangerouslySetInnerHTML`, `eval`, or `innerHTML` in the shipped app code. The installed Next.js version in [package-lock.json](package-lock.json) resolves to `15.5.12`, which is newer than the older `15.2.x` advisory range.

Severity assumes the app and backend are reachable from the public internet unless protected by infrastructure not visible in this repo.

## High Severity

### SEC-001: Unauthenticated upload signing endpoint can be abused to write arbitrary public files

- Rule ID: `NEXT-AUTH-UNPROTECTED-UPLOAD`
- Severity: High
- Location: `app/api/storage/upload/route.ts:135-242`, `.env.example:11-16`
- Evidence:

```ts
export async function POST(request: Request) {
  const storageUrl = process.env.SUPABASE_STORAGE_URL;
  const storageServiceKey = process.env.SUPABASE_STORAGE_SERVICE_KEY;
  const storageBucket = process.env.SUPABASE_STORAGE_BUCKET;
  ...
  const upstreamResponse = await fetch(createSignedUploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${storageServiceKey}`,
      apikey: storageServiceKey,
```

```env
# Service role key is required on the server route for authenticated uploads.
SUPABASE_STORAGE_SERVICE_KEY=<SUPABASE_SERVICE_ROLE_KEY>
# Bucket should be public for direct playback in the memory carousel.
SUPABASE_STORAGE_BUCKET=levelup-memory
```

- Impact: Any unauthenticated caller who can reach `/api/storage/upload` can mint signed upload URLs backed by your service-role key and store content in the public bucket. That creates a direct abuse path for storage-cost exhaustion, spam uploads, and public file hosting under your project.
- Fix: Require a real trust boundary before minting signed URLs. Options include authenticated users, short-lived server-issued game/session tokens, CAPTCHA plus strict rate limits, or moving uploads behind a server-controlled workflow that ties each upload to a valid game instance.
- Mitigation: Add edge rate limiting, request quotas by client/session, bucket lifecycle rules, and monitoring alerts for upload spikes.
- False positive notes: If an external gateway already enforces auth, CAPTCHA, and rate limits before this route, the effective severity is lower, but no such control is visible in app code.

## Medium Severity

### SEC-002: File validation trusts client-declared MIME and preserves attacker-chosen extensions

- Rule ID: `NEXT-UPLOAD-CONTENT-TYPE-TRUST`
- Severity: Medium
- Location: `app/api/storage/upload/route.ts:20-33`, `app/api/storage/upload/route.ts:88-116`, `app/api/storage/upload/route.ts:161-199`, `lib/upload-game-asset.ts:38-87`, `components/scape-pulse/flow/screens/final-destination-carousel-screen.tsx:361-366`, `components/scape-pulse/flow/screens/final-destination-carousel-screen.tsx:376-386`, `components/scape-pulse/flow/screens/final-destination-carousel-screen.tsx:486-497`
- Evidence:

```ts
function isMimeAllowed(assetType: AssetType, mimeType: string) {
  if (assetType === "selfie" || assetType === "drawing") {
    return mimeType.startsWith("image/");
  }
```

```ts
function extensionForFile(filename: string, mimeType: string) {
  const maybeNameExtension = filename.split(".").pop()?.toLowerCase() ?? "";
  if (/^[a-z0-9]{1,10}$/.test(maybeNameExtension)) {
    return maybeNameExtension;
  }
```

```ts
const directUploadResponse = await fetch(result.signedUrl, {
  method: "PUT",
  headers: {
    "content-type": file.type || "application/octet-stream",
```

- Impact: The server accepts broad `image/*`, `video/*`, and `audio/*` types based only on client-provided metadata, and it preserves the client’s chosen file extension. That makes it easy to upload content like SVG or mislabeled files into a public bucket, which increases the risk of malicious file hosting and future stored-XSS/content-spoofing issues if these URLs are ever linked or served through your app domain.
- Fix: Replace prefix checks with a strict allowlist of exact MIME types and matching extensions. For high-risk types, validate magic bytes server-side before signing or after upload, and block active content such as SVG/HTML unless you have a very specific reason to allow it.
- Mitigation: Serve uploads from a dedicated non-application domain, force safe `Content-Type` / `Content-Disposition` at the storage layer, and consider virus/malware scanning for public uploads.
- False positive notes: If your storage domain is fully isolated from the main app origin and enforces safe response headers, the XSS angle is reduced, but the public-file-hosting risk remains.

### SEC-003: No application-level security header policy is visible for the Next.js frontend

- Rule ID: `NEXT-HEADERS-BASELINE-MISSING`
- Severity: Medium
- Location: `next.config.ts:4-8`, `app/layout.tsx:29-37`
- Evidence:

```ts
const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
};
```

```tsx
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${bebasNeue.variable}`}>
```

- Impact: I could not find a CSP, clickjacking policy (`frame-ancestors` or `X-Frame-Options`), `X-Content-Type-Options`, or other baseline browser hardening in app code. If your edge/CDN is not adding them, the site is relying entirely on framework defaults and gets less protection against XSS, framing, and MIME-sniffing issues.
- Fix: Add a production header baseline either in `next.config.ts` headers or at the edge. Start with CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and a clickjacking defense.
- Mitigation: Verify the deployed site with runtime header checks before assuming this is already covered by infrastructure.
- False positive notes: This may already be handled by Vercel, nginx, Cloudflare, or another reverse proxy; that protection is simply not visible in this repo.

## Low Severity

### SEC-004: Upload endpoint returns upstream storage errors directly to clients

- Rule ID: `NEXT-ERROR-DISCLOSURE-001`
- Severity: Low
- Location: `app/api/storage/upload/route.ts:212-219`, `app/api/storage/upload/route.ts:243-245`
- Evidence:

```ts
if (!upstreamResponse.ok) {
  const upstreamError = await upstreamResponse.text();
  return NextResponse.json(
    {
      error: "Failed to create signed upload URL.",
      details: upstreamError.slice(0, 500)
```

```ts
const message = error instanceof Error ? error.message : "Unknown signed upload error";
return NextResponse.json({ error: "Failed to prepare upload.", details: message }, { status: 500 });
```

- Impact: Attackers can learn storage-provider error details, bucket behavior, or internal request failures that are useful for probing and abuse. This is not a direct compromise on its own, but it increases reconnaissance value.
- Fix: Log upstream details server-side and return a generic error to clients.
- Mitigation: Correlate user-facing failures with server-side structured logs using request IDs instead of exposing raw upstream messages.
- False positive notes: If upstream errors are already heavily sanitized by the storage provider, the disclosure is limited.

### SEC-005: FastAPI backend keeps default docs exposure and public health endpoints

- Rule ID: `FASTAPI-OPENAPI-EXPOSURE-001`
- Severity: Low
- Location: `backend/app/main.py:8-16`, `backend/app/api/health.py:13-36`
- Evidence:

```py
app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
```

```py
@router.get("")
def health() -> dict[str, str]:
    return {"status": "ok", "timestamp": datetime.now(UTC).isoformat()}

@router.get("/db")
def db_health(db: Session = Depends(get_db)) -> dict[str, str]:
```

- Impact: With the default FastAPI constructor, `/docs`, `/redoc`, and `/openapi.json` remain enabled unless disabled elsewhere. Combined with public health endpoints, that gives anonymous callers an easy map of the backend surface and its operational state.
- Fix: Disable docs in production (`docs_url=None`, `redoc_url=None`, `openapi_url=None`) or restrict them at the edge, and consider limiting `/health/db` to internal monitoring only.
- Mitigation: If the backend must stay public, keep docs on a separate internal hostname or require authentication.
- False positive notes: If this backend is only used locally or is behind a private network boundary, the practical risk is much lower.

## What Looked Good

- `.env` and `.env.local` are ignored in [.gitignore](.gitignore:16-20), and [.env.example](.env.example) contains placeholders rather than live secrets.
- I did not find tracked hardcoded credentials in the frontend or backend source I reviewed.
- I did not find obvious React DOM-XSS sinks such as `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or `new Function`.
- The installed Next.js package in [package-lock.json](package-lock.json:749-756) resolves to `15.5.12`, which is not in the older vulnerable `15.2.x` range.

## Recommended Next Steps

1. Fix `SEC-001` first by putting a real trust boundary and rate limiting in front of `/api/storage/upload`.
2. Tighten upload validation for `SEC-002` so only explicitly allowed media types and extensions can enter the public bucket.
3. Verify runtime response headers on the deployed site and add a header policy if your edge is not already doing it.
4. Reduce low-signal information disclosure by sanitizing upload errors and disabling FastAPI docs in production.
