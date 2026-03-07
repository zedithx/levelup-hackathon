"use client";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GhostButton, Panel, PrimaryButton, ProgressBar } from "@/components/drawing-game/flow/ui";

const DANCE_TITLE = "Viral TikTok Team Dance";
const MAX_RECORDING_SEC = 15;
const DEMO_STEPS = [
  "Step right + clap",
  "Step left + clap",
  "Spin and point",
  "Team pose finish"
];

type DanceScreen = "watch" | "record" | "review" | "submitted";

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.max(0, seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${mins}:${secs}`;
}

function supportedRecorderOptions() {
  if (typeof MediaRecorder === "undefined") {
    return undefined;
  }

  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4"
  ];

  const mimeType = candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));

  return mimeType ? { mimeType } : undefined;
}

export function DanceFlow() {
  const [screen, setScreen] = useState<DanceScreen>("watch");
  const [watchCount, setWatchCount] = useState(1);
  const [activeDemoStep, setActiveDemoStep] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isPreparingCamera, setIsPreparingCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);
  const submitTimeoutRef = useRef<number | null>(null);
  const shouldOpenReviewAfterStopRef = useRef(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null;
    }
  }, []);

  const clearRecordingTimers = useCallback(() => {
    if (recordingIntervalRef.current) {
      window.clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (stopTimeoutRef.current) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
  }, []);

  const clearRecordingUrl = useCallback(() => {
    setRecordingUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return null;
    });
  }, []);

  const stopRecording = useCallback(() => {
    clearRecordingTimers();
    setIsRecording(false);

    const recorder = recorderRef.current;

    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
  }, [clearRecordingTimers]);

  const openCameraStream = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera capture is not supported on this device.");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });

      streamRef.current = stream;

      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
        await previewVideoRef.current.play();
      }

      setCameraError(null);
      return true;
    } catch {
      setCameraError("Camera permission is required before recording.");
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording) {
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setCameraError("Video recording is not supported in this browser.");
      return;
    }

    if (!streamRef.current) {
      const canOpen = await openCameraStream();
      if (!canOpen || !streamRef.current) {
        return;
      }
    }

    clearRecordingUrl();
    chunksRef.current = [];
    setRecordingSec(0);
    shouldOpenReviewAfterStopRef.current = true;

    const recorder = new MediaRecorder(streamRef.current, supportedRecorderOptions());
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const shouldOpenReview = shouldOpenReviewAfterStopRef.current;
      shouldOpenReviewAfterStopRef.current = false;
      const blobType = recorder.mimeType || "video/webm";

      if (!shouldOpenReview) {
        chunksRef.current = [];
        stopStream();
        return;
      }

      if (!chunksRef.current.length) {
        setCameraError("No video was captured. Please record again.");
        chunksRef.current = [];
        stopStream();
        return;
      }

      const recordingBlob = new Blob(chunksRef.current, { type: blobType });
      const nextUrl = URL.createObjectURL(recordingBlob);

      setRecordingUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }

        return nextUrl;
      });

      setScreen("review");
      stopStream();
    };

    recorder.onerror = () => {
      setCameraError("Recording failed. Please try again.");
      setIsRecording(false);
      clearRecordingTimers();
    };

    recorder.start(250);
    setIsRecording(true);

    const startAt = Date.now();
    recordingIntervalRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startAt) / 1000);
      setRecordingSec(Math.min(elapsed, MAX_RECORDING_SEC));
    }, 200);

    stopTimeoutRef.current = window.setTimeout(() => {
      stopRecording();
    }, MAX_RECORDING_SEC * 1000);
  }, [clearRecordingTimers, clearRecordingUrl, isRecording, openCameraStream, stopRecording, stopStream]);

  const handleFileUploadFallback = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      const nextUrl = URL.createObjectURL(file);
      setRecordingUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }

        return nextUrl;
      });
      setScreen("review");
      setCameraError(null);
    },
    []
  );

  const submitRecording = useCallback(() => {
    if (!recordingUrl || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    submitTimeoutRef.current = window.setTimeout(() => {
      setIsSubmitting(false);
      setScreen("submitted");
      stopStream();
    }, 1000);
  }, [isSubmitting, recordingUrl, stopStream]);

  const returnToRecord = useCallback(() => {
    clearRecordingUrl();
    setRecordingSec(0);
    setIsSubmitting(false);
    setCameraError(null);
    setScreen("record");
  }, [clearRecordingUrl]);

  const restartFlow = useCallback(() => {
    clearRecordingUrl();
    setRecordingSec(0);
    setIsSubmitting(false);
    setCameraError(null);
    setWatchCount(1);
    setScreen("watch");
  }, [clearRecordingUrl]);

  useEffect(() => {
    if (screen !== "watch") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveDemoStep((current) => (current + 1) % DEMO_STEPS.length);
    }, 1100);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [screen]);

  useEffect(() => {
    if (screen !== "record") {
      if (recorderRef.current?.state === "recording") {
        shouldOpenReviewAfterStopRef.current = false;
        recorderRef.current.stop();
      }
      clearRecordingTimers();
      return;
    }

    let cancelled = false;

    const prepareCamera = async () => {
      setIsPreparingCamera(true);
      const canOpen = await openCameraStream();
      if (!cancelled && !canOpen) {
        setCameraError("Could not access camera. You can upload a pre-recorded team video below.");
      }
      if (!cancelled) {
        setIsPreparingCamera(false);
      }
    };

    void prepareCamera();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [clearRecordingTimers, openCameraStream, screen, stopStream]);

  useEffect(() => {
    return () => {
      clearRecordingTimers();
      stopStream();

      if (submitTimeoutRef.current) {
        window.clearTimeout(submitTimeoutRef.current);
      }

      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
    };
  }, [clearRecordingTimers, recordingUrl, stopStream]);

  const recordProgress = useMemo(() => {
    if (!isRecording) {
      return 0;
    }

    return Math.min(recordingSec / MAX_RECORDING_SEC, 1);
  }, [isRecording, recordingSec]);

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,rgba(255,51,153,0.16),transparent_42%),#050505] md:px-6 md:py-8">
      <main className="mx-auto min-h-[100dvh] w-full max-w-[393px] overflow-hidden border border-white/10 bg-[#0a0a0a] text-white md:min-h-[852px] md:rounded-[24px]">
        <header className="flex h-14 items-center justify-between px-5">
          <p className="font-display text-[clamp(1rem,4.4vw,1.12rem)] leading-7 tracking-[0.045em]">
            <span className="text-[#ff3399]">*SCAPE</span>
            <span className="text-white/20"> | </span>
            <span className="text-white/85">DANCE FLOW</span>
          </p>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] font-bold tracking-[0.08em] text-white/60">
            {screen === "watch" ? "WATCH" : screen === "record" ? "RECORD" : screen === "review" ? "REVIEW" : "SUBMIT"}
          </span>
        </header>
        <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <section className="flex min-h-[calc(100dvh-57px)] flex-col px-5 pb-5 pt-4 md:min-h-[795px]">
          {screen === "watch" ? (
            <div className="anim-screen-in flex h-full flex-1 flex-col">
              <div className="text-center">
                <p className="text-xs tracking-[0.2em] text-[#ff3399]">TEAM CHALLENGE</p>
                <h1 className="mt-3 font-display text-[clamp(2rem,9vw,2.6rem)] leading-none text-white">{DANCE_TITLE}</h1>
                <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-white/65">
                  Watch this short placeholder dance carefully. Replay it as many times as needed before recording your team.
                </p>
              </div>

              <Panel className="mt-5 border-[#ff3399]/35 bg-[rgba(255,51,153,0.09)]">
                <p className="text-xs tracking-[0.12em] text-[#ff3399]">PLACEHOLDER DANCE PREVIEW</p>
                <div className="mt-3 rounded-2xl border border-white/15 bg-[#121212] p-4">
                  <div className="flex items-center justify-between text-[0.72rem] tracking-[0.1em] text-white/45">
                    <span>NOW PLAYING</span>
                    <span>LOOPING DEMO</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {DEMO_STEPS.map((step, index) => (
                      <div
                        className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                          activeDemoStep === index
                            ? "border-[#ff3399]/55 bg-[#ff3399]/25 text-white"
                            : "border-white/10 bg-white/5 text-white/60"
                        }`}
                        key={step}
                      >
                        {index + 1}. {step}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-white/45">Replay count: {watchCount}</p>
                  <GhostButton
                    className="h-9"
                    label="Watch again"
                    onClick={() => {
                      setWatchCount((current) => current + 1);
                      setActiveDemoStep((current) => (current + 1) % DEMO_STEPS.length);
                    }}
                  />
                </div>
              </Panel>

              <Panel className="mt-4">
                <p className="text-xs tracking-[0.14em] text-white/40">RECORDING INSTRUCTIONS</p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-white/70">
                  <li>1. Record one short team take of the dance.</li>
                  <li>2. Upload your recorded video after previewing playback.</li>
                  <li>3. Scoring is based on dance accuracy and overall team performance.</li>
                </ul>
              </Panel>

              <div className="mt-auto">
                <PrimaryButton label="Ready to record" onClick={() => setScreen("record")} />
              </div>
            </div>
          ) : null}

          {screen === "record" ? (
            <div className="anim-screen-in flex h-full flex-1 flex-col">
              <Panel className="border-[#00d4ff]/35 bg-[rgba(0,212,255,0.09)]">
                <p className="text-xs tracking-[0.14em] text-[#00d4ff]">TEAM RECORDING</p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Press start when your full team is in frame. Stop anytime, or auto-stop after {MAX_RECORDING_SEC} seconds.
                </p>
              </Panel>

              <div className="mt-4 overflow-hidden rounded-2xl border border-white/15 bg-[#121212]">
                <video
                  autoPlay
                  className="aspect-[9/16] w-full bg-black object-cover"
                  muted
                  playsInline
                  ref={previewVideoRef}
                />
              </div>

              <Panel className="mt-4">
                <div className="flex items-center justify-between text-xs tracking-[0.1em] text-white/45">
                  <span>{isRecording ? "RECORDING" : "READY"}</span>
                  <span>{isRecording ? `${formatTime(recordingSec)} / ${formatTime(MAX_RECORDING_SEC)}` : `MAX ${MAX_RECORDING_SEC}s`}</span>
                </div>
                <div className="mt-2">
                  <ProgressBar accent="#ff3399" progress={recordProgress} />
                </div>
              </Panel>

              {cameraError ? <p className="mt-3 text-sm text-[#ff9bb9]">{cameraError}</p> : null}

              <div className="mt-auto space-y-3">
                <PrimaryButton
                  disabled={isPreparingCamera}
                  label={isRecording ? "Stop recording" : isPreparingCamera ? "Opening camera..." : "Start recording"}
                  onClick={isRecording ? stopRecording : () => void startRecording()}
                />
                <label className="block cursor-pointer rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-center text-xs text-white/65 hover:border-white/25">
                  Upload recorded video instead
                  <input accept="video/*" className="hidden" onChange={handleFileUploadFallback} type="file" />
                </label>
                <GhostButton className="h-10 w-full" label="Back to dance preview" onClick={() => setScreen("watch")} />
              </div>
            </div>
          ) : null}

          {screen === "review" ? (
            <div className="anim-screen-in flex h-full flex-1 flex-col">
              <Panel className="border-[#ffd700]/35 bg-[rgba(255,215,0,0.09)]">
                <p className="text-xs tracking-[0.14em] text-[#ffd700]">REVIEW PLAYBACK</p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Watch the take, then submit if your team is happy or retake to try again.
                </p>
              </Panel>

              {recordingUrl ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/15 bg-[#121212]">
                  <video className="aspect-[9/16] w-full bg-black object-cover" controls playsInline src={recordingUrl} />
                </div>
              ) : (
                <Panel className="mt-4">
                  <p className="text-sm text-white/60">No recording available. Please go back and capture a take.</p>
                </Panel>
              )}

              <div className="mt-auto space-y-3">
                <PrimaryButton
                  disabled={!recordingUrl || isSubmitting}
                  label={isSubmitting ? "Submitting..." : "Submit video"}
                  onClick={submitRecording}
                />
                <GhostButton className="h-10 w-full" label="Retake dance" onClick={returnToRecord} />
              </div>
            </div>
          ) : null}

          {screen === "submitted" ? (
            <div className="anim-screen-in flex h-full flex-1 flex-col">
              <Panel className="border-[#00d4ff]/35 bg-[rgba(0,212,255,0.09)] text-center">
                <p className="text-xs tracking-[0.14em] text-[#00d4ff]">UPLOAD COMPLETE</p>
                <h2 className="mt-3 font-display text-[clamp(1.9rem,8.8vw,2.4rem)] leading-none text-white">
                  Team Dance Submitted
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Your dance recording will be scored on choreography accuracy and team performance.
                </p>
              </Panel>

              <Panel className="mt-4">
                <p className="text-sm leading-6 text-white/70">
                  If you want a better score, you can run another take and submit again.
                </p>
              </Panel>

              <div className="mt-auto space-y-3">
                <PrimaryButton label="Record another take" onClick={restartFlow} />
                <GhostButton className="h-10 w-full" label="Review current playback" onClick={() => setScreen("review")} />
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
