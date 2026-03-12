import { NextResponse } from "next/server";
import {
  applyRateLimitHeaders,
  consumeUploadSessionIssueLimit,
  createUploadSessionToken,
  isAllowedUploadOrigin,
  isUploadSecurityConfigured,
  missingUploadSecurityMessage,
  UPLOAD_SESSION_COOKIE_NAME,
  uploadSessionCookieMaxAgeSeconds
} from "@/lib/upload-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isUploadSecurityConfigured()) {
    return NextResponse.json({ error: missingUploadSecurityMessage() }, { status: 500 });
  }

  if (!isAllowedUploadOrigin(request)) {
    return NextResponse.json({ error: "Upload session requests must originate from this site." }, { status: 403 });
  }

  const sessionIssueRateLimit = consumeUploadSessionIssueLimit(request);

  if (!sessionIssueRateLimit.allowed) {
    const response = NextResponse.json(
      {
        error: "Too many upload session requests. Please wait a few minutes and try again."
      },
      { status: 429 }
    );
    response.headers.set("cache-control", "no-store");
    applyRateLimitHeaders(response.headers, sessionIssueRateLimit);

    return response;
  }

  const uploadSessionToken = createUploadSessionToken(request.headers.get("user-agent"));

  if (!uploadSessionToken) {
    return NextResponse.json({ error: missingUploadSecurityMessage() }, { status: 500 });
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set({
    httpOnly: true,
    maxAge: uploadSessionCookieMaxAgeSeconds(),
    name: UPLOAD_SESSION_COOKIE_NAME,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    value: uploadSessionToken
  });
  response.headers.set("cache-control", "no-store");
  applyRateLimitHeaders(response.headers, sessionIssueRateLimit);

  return response;
}
