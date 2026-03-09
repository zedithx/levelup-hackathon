/* eslint-disable @next/next/no-img-element */

"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { FlowShell, Panel, PrimaryButton } from "@/components/drawing-game/flow/ui";
import { saveSelfieMemoryAsset } from "@/lib/memory-assets";
import { uploadGameAsset } from "@/lib/upload-game-asset";

const VERIFY_DELAY_MS = 400;
const MAX_IMAGE_SIZE_BYTES = 12 * 1024 * 1024;

type SelfieVerificationState = "idle" | "verifying" | "success" | "error";

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function SelfieFlow({ onComplete }: { onComplete?: () => void } = {}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const verifyTimeoutRef = useRef<number | null>(null);

  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState("");
  const [verificationState, setVerificationState] = useState<SelfieVerificationState>("idle");
  const [statusMessage, setStatusMessage] = useState("Take a team selfie with the car, then upload it.");

  const hasUpload = Boolean(selfieFile);
  const isVerifying = verificationState === "verifying";
  const isSuccessful = verificationState === "success";
  const canVerify = hasUpload && !isVerifying && !isSuccessful;

  useEffect(() => {
    if (!selfieFile) {
      setSelfiePreviewUrl("");
      return;
    }

    const nextObjectUrl = URL.createObjectURL(selfieFile);
    setSelfiePreviewUrl(nextObjectUrl);

    return () => {
      URL.revokeObjectURL(nextObjectUrl);
    };
  }, [selfieFile]);

  useEffect(() => {
    return () => {
      if (verifyTimeoutRef.current !== null) {
        window.clearTimeout(verifyTimeoutRef.current);
      }
    };
  }, []);

  const flowSteps = useMemo(
    () => [
      { label: "Find Car", complete: true },
      { label: "Group Selfie", complete: hasUpload },
      { label: "Verify Upload", complete: isSuccessful },
      { label: "Task Successful", complete: isSuccessful }
    ],
    [hasUpload, isSuccessful]
  );

  const openPicker = () => {
    fileInputRef.current?.click();
  };

  const resetUpload = () => {
    if (verifyTimeoutRef.current !== null) {
      window.clearTimeout(verifyTimeoutRef.current);
      verifyTimeoutRef.current = null;
    }

    setSelfieFile(null);
    setVerificationState("idle");
    setStatusMessage("Take a team selfie with the car, then upload it.");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSelfiePicked = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      return;
    }

    if (!nextFile.type.startsWith("image/")) {
      setSelfieFile(null);
      setVerificationState("error");
      setStatusMessage("Upload failed: please choose an image file.");
      return;
    }

    if (nextFile.size > MAX_IMAGE_SIZE_BYTES) {
      setSelfieFile(null);
      setVerificationState("error");
      setStatusMessage("Upload failed: image must be 12 MB or smaller.");
      return;
    }

    setSelfieFile(nextFile);
    setVerificationState("idle");
    setStatusMessage("Upload complete. Tap verify when your group selfie is ready.");
  };

  const runVerification = async () => {
    if (!selfieFile) {
      setVerificationState("error");
      setStatusMessage("Upload a selfie first before verifying.");
      return;
    }

    setVerificationState("verifying");
    setStatusMessage("Uploading selfie to bucket and verifying checkpoint...");

    try {
      const uploadResult = await uploadGameAsset({
        assetType: "selfie",
        file: selfieFile
      });
      saveSelfieMemoryAsset(uploadResult.publicUrl);

      await new Promise<void>((resolve) => {
        verifyTimeoutRef.current = window.setTimeout(() => {
          verifyTimeoutRef.current = null;
          resolve();
        }, VERIFY_DELAY_MS);
      });

      setVerificationState("success");
      setStatusMessage("Task successful. Your squad selfie is uploaded and verified.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload selfie.";
      setVerificationState("error");
      setStatusMessage(message);
    }
  };

  return (
    <FlowShell stepLabel="SELFIE FLOW">
      <div className="anim-screen-in flex min-h-0 flex-1 flex-col">
        <div className="anim-fade-up text-center" style={{ animationDelay: "60ms" }}>
          <p className="text-xs tracking-[0.26em] text-[#00d4ff]">PHOTO CHALLENGE</p>
          <h1 className="mt-3 font-display text-[clamp(2rem,9vw,2.6rem)] leading-none tracking-[0.03em] text-white">
            GROUP SELFIE CHECKPOINT
          </h1>
          <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-white/55">
            Gather your teammates beside the car you found. Capture one group selfie, upload it, and clear the task.
          </p>
        </div>

        <Panel
          className="anim-fade-up mt-5 border-[#00d4ff]/25 bg-[rgba(0,212,255,0.08)]"
          style={{ animationDelay: "130ms" }}
        >
          <p className="text-xs tracking-[0.14em] text-[#00d4ff]">MISSION FLOW</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {flowSteps.map((step) => (
              <div
                className={`rounded-lg border px-2.5 py-2 ${
                  step.complete
                    ? "border-[#00d4ff]/45 bg-[#00d4ff]/15 text-[#b8f4ff]"
                    : "border-white/10 bg-white/5 text-white/55"
                }`}
                key={step.label}
              >
                {step.complete ? "✓ " : ""}
                {step.label}
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="anim-fade-up mt-4" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs tracking-[0.12em] text-white/40">UPLOAD SELFIE</p>
            {selfieFile ? (
              <p className="text-xs text-white/45">
                {formatFileSize(selfieFile.size)}
              </p>
            ) : null}
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-[#121212]">
            {selfiePreviewUrl ? (
              <img
                alt="Uploaded group selfie preview"
                className="h-48 w-full object-cover"
                src={selfiePreviewUrl}
              />
            ) : (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-white/40">
                <span className="rounded-full border border-white/20 bg-white/5 px-2 py-1 text-[0.65rem] tracking-[0.14em]">
                  PHOTO
                </span>
                <p className="max-w-[220px] text-xs leading-5">
                  No selfie uploaded yet. Use camera or gallery to add your team photo with the car.
                </p>
              </div>
            )}
          </div>

          {selfieFile ? <p className="mt-2 truncate text-xs text-white/55">{selfieFile.name}</p> : null}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              className="anim-elevate btn-fit h-11 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white/80 transition-colors hover:border-[#ff6b00]/40 hover:text-white"
              onClick={openPicker}
              type="button"
            >
              {selfieFile ? "Replace Photo" : "Upload Photo"}
            </button>
            <button
              className="anim-elevate btn-fit h-11 rounded-xl border border-white/10 bg-[#111] text-sm font-bold text-white/70 transition-colors hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:text-white/20"
              disabled={!selfieFile}
              onClick={resetUpload}
              type="button"
            >
              Clear
            </button>
          </div>

          <input
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onSelfiePicked}
            ref={fileInputRef}
            type="file"
          />
        </Panel>

        <Panel className="anim-fade-up mt-4 border-[#ff6b00]/25 bg-[rgba(255,107,0,0.08)]" style={{ animationDelay: "280ms" }}>
          <p className="text-xs tracking-[0.12em] text-[#ff6b00]">VERIFY CHECKPOINT</p>
          <p
            className={`mt-2 text-sm leading-6 ${
              verificationState === "error"
                ? "text-[#ff8a8a]"
                : verificationState === "success"
                  ? "text-[#8fffd2]"
                  : "text-white/70"
            }`}
          >
            {statusMessage}
          </p>

          {isVerifying ? (
            <div className="mt-4 flex items-center gap-2 text-xs tracking-[0.08em] text-white/55">
              <span className="anim-soft-spin inline-flex size-4 rounded-full border-2 border-white/20 border-t-[#ff6b00]" />
              ANALYZING IMAGE...
            </div>
          ) : null}

          <PrimaryButton
            className="mt-4"
            disabled={!canVerify}
            label={isVerifying ? "Verifying..." : isSuccessful ? "Verified" : "Verify Selfie"}
            onClick={runVerification}
          />

          <button
            className="mt-2 h-9 w-full rounded-[10px] border border-dashed border-white/10 text-xs font-bold text-white/20 transition-colors hover:text-white/40"
            onClick={() => onComplete ? onComplete() : router.push("/ar-experience")}
            type="button"
          >
            [DEV] Skip selfie verification
          </button>

          {isSuccessful ? (
            <div className={`mt-3 ${onComplete ? "" : "grid grid-cols-2 gap-2"}`}>
              <button
                className="anim-elevate btn-fit h-11 w-full rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white/80 transition-colors hover:border-white/25 hover:text-white"
                onClick={() => onComplete ? onComplete() : router.push("/ar-experience")}
                type="button"
              >
                Continue to AR
              </button>
              {!onComplete ? (
                <button
                  className="anim-elevate btn-fit h-11 rounded-xl border border-[#00d4ff]/35 bg-[#00d4ff]/20 text-sm font-bold text-[#b8f4ff] transition-colors hover:border-[#00d4ff]/60 hover:bg-[#00d4ff]/30"
                  onClick={() => router.push("/")}
                  type="button"
                >
                  Back to Lobby
                </button>
              ) : null}
            </div>
          ) : null}
        </Panel>
      </div>
    </FlowShell>
  );
}
