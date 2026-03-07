"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GhostButton, Panel, PrimaryButton, ProgressBar } from "@/components/drawing-game/flow/ui";
import { saveDanceMemoryAsset } from "@/lib/memory-assets";
import { uploadGameAsset } from "@/lib/upload-game-asset";

const DANCE_TITLE = "Viral TikTok Team Dance";
const FALLBACK_RECORDING_SEC = 15;
const PRE_RECORD_COUNTDOWN_SEC = 3;
const DANCE_RECORD_AUDIO_SRC = "/audio/dance.mp3";

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

function extensionFromVideoType(mimeType: string) {
  if (mimeType.includes("mp4")) {
    return "mp4";
  }

  if (mimeType.includes("webm")) {
    return "webm";
  }

  return "webm";
}

export function DanceFlow() {
  const router = useRouter();
  const [screen, setScreen] = useState<DanceScreen>("watch");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isPreparingCamera, setIsPreparingCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdownSec, setCountdownSec] = useState<number | null>(null);
  const [songDurationSec, setSongDurationSec] = useState(FALLBACK_RECORDING_SEC);
  const [recordingSec, setRecordingSec] = useState(0);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingFile, setRecordingFile] = useState<File | null>(null);
  const [needsReviewMusicOverlay, setNeedsReviewMusicOverlay] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const danceAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const reviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const countdownIntervalRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);
  const shouldOpenReviewAfterStopRef = useRef(false);

  const recordingLimitSec = useMemo(() => {
    if (!Number.isFinite(songDurationSec) || songDurationSec <= 0) {
      return FALLBACK_RECORDING_SEC;
    }

    return Math.max(1, Math.round(songDurationSec));
  }, [songDurationSec]);

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

  const clearCountdownTimer = useCallback(() => {
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    setCountdownSec(null);
  }, []);

  const stopDanceAudio = useCallback(() => {
    const audioElement = danceAudioRef.current;

    if (!audioElement) {
      return;
    }

    audioElement.pause();
    audioElement.currentTime = 0;
  }, []);

  const playDanceAudio = useCallback(async () => {
    const audioElement = danceAudioRef.current;

    if (!audioElement) {
      return;
    }

    try {
      audioElement.currentTime = 0;
      await audioElement.play();
    } catch {
      // Browser autoplay policies may block delayed playback after countdown.
    }
  }, []);

  const clearRecordingUrl = useCallback(() => {
    setRecordingUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return null;
    });
    setRecordingFile(null);
    setNeedsReviewMusicOverlay(false);
  }, []);

  useEffect(() => {
    const audioElement = danceAudioRef.current;

    if (!audioElement) {
      return;
    }

    const syncDurationFromAudio = () => {
      if (!Number.isFinite(audioElement.duration) || audioElement.duration <= 0) {
        return;
      }

      setSongDurationSec(audioElement.duration);
    };

    syncDurationFromAudio();
    audioElement.addEventListener("loadedmetadata", syncDurationFromAudio);
    audioElement.addEventListener("durationchange", syncDurationFromAudio);

    return () => {
      audioElement.removeEventListener("loadedmetadata", syncDurationFromAudio);
      audioElement.removeEventListener("durationchange", syncDurationFromAudio);
    };
  }, []);

  const stopRecording = useCallback(() => {
    clearRecordingTimers();
    clearCountdownTimer();
    setIsRecording(false);
    stopDanceAudio();

    const recorder = recorderRef.current;

    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
  }, [clearCountdownTimer, clearRecordingTimers, stopDanceAudio]);

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

  const beginRecordingNow = useCallback(async () => {
    if (screen !== "record" || isRecording) {
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setCameraError("Video recording is not supported in this browser.");
      return;
    }

    if (!streamRef.current) {
      setCameraError("Camera stream unavailable. Please try again.");
      return;
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
      const extension = extensionFromVideoType(blobType);
      const nextFile = new File([recordingBlob], `dance-${Date.now()}.${extension}`, { type: blobType });

      setRecordingUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }

        return nextUrl;
      });
      setRecordingFile(nextFile);
      setNeedsReviewMusicOverlay(true);

      setScreen("review");
      stopStream();
    };

    recorder.onerror = () => {
      setCameraError("Recording failed. Please try again.");
      setIsRecording(false);
      stopDanceAudio();
      clearRecordingTimers();
    };

    recorder.start(250);
    setIsRecording(true);
    void playDanceAudio();

    const startAt = Date.now();
    recordingIntervalRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startAt) / 1000);
      setRecordingSec(Math.min(elapsed, recordingLimitSec));
    }, 200);

    stopTimeoutRef.current = window.setTimeout(() => {
      stopRecording();
    }, recordingLimitSec * 1000);
  }, [
    clearRecordingTimers,
    clearRecordingUrl,
    isRecording,
    playDanceAudio,
    recordingLimitSec,
    screen,
    stopDanceAudio,
    stopRecording,
    stopStream
  ]);

  const startRecording = useCallback(async () => {
    if (isRecording || countdownSec !== null) {
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

    setCameraError(null);
    setCountdownSec(PRE_RECORD_COUNTDOWN_SEC);

    let nextSec = PRE_RECORD_COUNTDOWN_SEC;
    countdownIntervalRef.current = window.setInterval(() => {
      nextSec -= 1;

      if (nextSec <= 0) {
        clearCountdownTimer();
        void beginRecordingNow();
        return;
      }

      setCountdownSec(nextSec);
    }, 1000);
  }, [beginRecordingNow, clearCountdownTimer, countdownSec, isRecording, openCameraStream]);

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
      setRecordingFile(file);
      setNeedsReviewMusicOverlay(false);
      setScreen("review");
      setCameraError(null);
    },
    []
  );

  const submitRecording = useCallback(async () => {
    if (!recordingFile || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setCameraError(null);

    try {
      const uploadResult = await uploadGameAsset({
        assetType: "dance",
        file: recordingFile
      });
      saveDanceMemoryAsset(uploadResult.publicUrl);

      setIsSubmitting(false);
      setScreen("submitted");
      stopStream();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload video.";
      setIsSubmitting(false);
      setCameraError(message);
    }
  }, [isSubmitting, recordingFile, stopStream]);

  const returnToRecord = useCallback(() => {
    clearRecordingUrl();
    setRecordingSec(0);
    setIsSubmitting(false);
    setCameraError(null);
    setScreen("record");
  }, [clearRecordingUrl]);

  useEffect(() => {
    if (screen !== "record") {
      clearCountdownTimer();
      stopDanceAudio();
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
      clearCountdownTimer();
      stopDanceAudio();
      stopStream();
    };
  }, [clearCountdownTimer, clearRecordingTimers, openCameraStream, screen, stopDanceAudio, stopStream]);

  useEffect(() => {
    return () => {
      clearCountdownTimer();
      clearRecordingTimers();
      stopDanceAudio();
      stopStream();

      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
    };
  }, [clearCountdownTimer, clearRecordingTimers, recordingUrl, stopDanceAudio, stopStream]);

  const recordProgress = useMemo(() => {
    if (!isRecording) {
      return 0;
    }

    return Math.min(recordingSec / recordingLimitSec, 1);
  }, [isRecording, recordingLimitSec, recordingSec]);

  const isCountdownActive = countdownSec !== null;

  const syncReviewMusicToVideo = useCallback(
    (shouldPlay: boolean) => {
      if (!needsReviewMusicOverlay) {
        stopDanceAudio();
        return;
      }

      const reviewVideo = reviewVideoRef.current;
      const audioElement = danceAudioRef.current;

      if (!reviewVideo || !audioElement) {
        return;
      }

      if (Math.abs(audioElement.currentTime - reviewVideo.currentTime) > 0.2) {
        audioElement.currentTime = reviewVideo.currentTime;
      }
      audioElement.playbackRate = reviewVideo.playbackRate || 1;
      audioElement.muted = reviewVideo.muted;
      audioElement.volume = reviewVideo.volume;

      if (shouldPlay) {
        void audioElement.play().catch(() => {
          // Browser autoplay policies may block programmatic playback.
        });
        return;
      }

      audioElement.pause();
    },
    [needsReviewMusicOverlay, stopDanceAudio]
  );

  return (
    <div className="anim-ambient-bg min-h-[100dvh] bg-[radial-gradient(circle_at_top,rgba(255,51,153,0.16),transparent_42%),#050505] md:px-6 md:py-8">
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
        <section className="flex min-h-[calc(100dvh-57px)] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-4 md:min-h-[795px]">
          <audio preload="auto" ref={danceAudioRef} src={DANCE_RECORD_AUDIO_SRC} />
          {screen === "watch" ? (
            <div className="anim-screen-in anim-stagger flex h-full flex-1 flex-col">
              <div className="text-center">
                <p className="text-xs tracking-[0.2em] text-[#ff3399]">TEAM CHALLENGE</p>
                <h1 className="mt-3 font-display text-[clamp(2rem,9vw,2.6rem)] leading-none text-white">{DANCE_TITLE}</h1>
                <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-white/65">
                  Watch this short placeholder dance carefully. Replay it as many times as needed before recording your team.
                </p>
              </div>

              <Panel className="mt-5 border-[#ff3399]/35 bg-[rgba(255,51,153,0.09)]">
                <p className="text-xs tracking-[0.12em] text-[#ff3399]">GUIDING DANCE (BATIDAO)</p>
                <div className="mt-3 overflow-hidden rounded-2xl border border-white/15 bg-[#121212]">
                  <video
                    className="aspect-[9/16] w-full bg-black object-cover"
                    controls
                    playsInline
                    preload="metadata"
                    src="/video/dance.mp4"
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
            <div className="anim-screen-in anim-stagger flex h-full flex-1 flex-col">
              <Panel className="border-[#00d4ff]/35 bg-[rgba(0,212,255,0.09)]">
                <p className="text-xs tracking-[0.14em] text-[#00d4ff]">TEAM RECORDING</p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Press start when your full team is in frame. Recording begins after a 3-second countdown, then auto-stops when
                  the song ends.
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
                  <span>{isRecording ? "RECORDING" : isCountdownActive ? "COUNTDOWN" : "READY"}</span>
                  <span>
                    {isRecording
                      ? `${formatTime(recordingSec)} / ${formatTime(recordingLimitSec)}`
                      : isCountdownActive
                        ? `Starts in ${countdownSec}s`
                        : `SONG ${formatTime(recordingLimitSec)}`}
                  </span>
                </div>
                <div className="mt-2">
                  <ProgressBar accent="#ff3399" progress={recordProgress} />
                </div>
              </Panel>

              {isCountdownActive ? (
                <p className="mt-3 text-center font-display text-4xl leading-none text-[#ffd700]">{countdownSec}</p>
              ) : null}

              {cameraError ? <p className="mt-3 text-sm text-[#ff9bb9]">{cameraError}</p> : null}

              <div className="mt-auto space-y-3">
                <PrimaryButton
                  disabled={isPreparingCamera || isCountdownActive}
                  label={
                    isRecording
                      ? "Stop recording"
                      : isCountdownActive
                        ? `Starting in ${countdownSec}...`
                        : isPreparingCamera
                          ? "Opening camera..."
                          : "Start recording"
                  }
                  onClick={isRecording ? stopRecording : () => void startRecording()}
                />
                <label className="anim-elevate btn-fit flex cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/5 text-xs text-white/65 hover:border-white/25">
                  Upload recorded video instead
                  <input accept="video/*" className="hidden" onChange={handleFileUploadFallback} type="file" />
                </label>
                <GhostButton className="h-10 w-full" label="Back to dance preview" onClick={() => setScreen("watch")} />
              </div>
            </div>
          ) : null}

          {screen === "review" ? (
            <div className="anim-screen-in anim-stagger flex h-full flex-1 flex-col">
              <Panel className="border-[#ffd700]/35 bg-[rgba(255,215,0,0.09)]">
                <p className="text-xs tracking-[0.14em] text-[#ffd700]">REVIEW PLAYBACK</p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Watch the take, then submit if your team is happy or retake to try again.
                </p>
              </Panel>

              {recordingUrl ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/15 bg-[#121212]">
                  <video
                    className="aspect-[9/16] w-full bg-black object-cover"
                    controls
                    onEnded={stopDanceAudio}
                    onPause={() => syncReviewMusicToVideo(false)}
                    onPlay={() => syncReviewMusicToVideo(true)}
                    onRateChange={() => syncReviewMusicToVideo(!reviewVideoRef.current?.paused)}
                    onSeeked={() => syncReviewMusicToVideo(!reviewVideoRef.current?.paused)}
                    onVolumeChange={() => syncReviewMusicToVideo(!reviewVideoRef.current?.paused)}
                    playsInline
                    ref={reviewVideoRef}
                    src={recordingUrl}
                  />
                </div>
              ) : (
                <Panel className="mt-4">
                  <p className="text-sm text-white/60">No recording available. Please go back and capture a take.</p>
                </Panel>
              )}

              <div className="mt-auto space-y-3">
                <PrimaryButton
                  disabled={!recordingFile || isSubmitting}
                  label={isSubmitting ? "Uploading..." : "Submit video"}
                  onClick={() => void submitRecording()}
                />
                <GhostButton className="h-10 w-full" label="Retake dance" onClick={returnToRecord} />
              </div>
            </div>
          ) : null}

          {screen === "submitted" ? (
            <div className="anim-screen-in anim-stagger flex h-full flex-1 flex-col">
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
                  The team dance is locked in. Continue to the AR camera view for the next experience.
                </p>
              </Panel>

              <div className="mt-auto space-y-3">
                <PrimaryButton label="Continue to AR" onClick={() => router.push("/ar-experience")} />
                <GhostButton className="h-10 w-full" label="Review current playback" onClick={() => setScreen("review")} />
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
