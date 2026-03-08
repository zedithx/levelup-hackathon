"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MindARImageSceneProps = {
  targetMindFileSrc: string;
  scanningEnabled: boolean;
  onTargetFound: (targetIndex: number) => void;
  targetIndexes?: number[];
  onArReadyChange?: (isReady: boolean) => void;
};

type MindARSystem = {
  start?: () => void;
  stop?: () => void;
  pause?: (keepVideo?: boolean) => void;
  unpause?: () => void;
  video?: HTMLVideoElement | null;
  controller?: {
    stopProcessVideo?: () => void;
    processVideo?: (video: HTMLVideoElement) => void;
    dispose?: () => void;
  };
  __safeStopPatched?: boolean;
};

type MindARSceneElement = HTMLElement & {
  systems?: {
    [systemName: string]: MindARSystem;
  };
};

let mindARBootstrapPromise: Promise<void> | null = null;

async function ensureMindARLoaded() {
  if (typeof window === "undefined") {
    return;
  }

  if (!mindARBootstrapPromise) {
    mindARBootstrapPromise = (async () => {
      await import("aframe");
      await import("mind-ar/dist/mindar-image.prod.js");
      await import("mind-ar/dist/mindar-image-aframe.prod.js");
    })();
  }

  await mindARBootstrapPromise;
}

export function MindARImageScene({
  targetMindFileSrc,
  scanningEnabled,
  onTargetFound,
  targetIndexes,
  onArReadyChange
}: MindARImageSceneProps) {
  const sceneRef = useRef<MindARSceneElement | null>(null);
  const targetEntityRefs = useRef<Record<number, HTMLElement | null>>({});
  const hasStartedRef = useRef(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [isArReady, setIsArReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const trackedTargetIndexes = useMemo(() => {
    const uniqueIndexes = Array.from(new Set(targetIndexes ?? [0])).filter(
      (targetIndex) => Number.isInteger(targetIndex) && targetIndex >= 0
    );

    if (!uniqueIndexes.length) {
      return [0];
    }

    return uniqueIndexes;
  }, [targetIndexes]);

  const mindArAttr = useMemo(
    () =>
      `imageTargetSrc: ${targetMindFileSrc}; autoStart: false;`,
    [targetMindFileSrc]
  );

  useEffect(() => {
    let isCancelled = false;

    const bootstrap = async () => {
      try {
        await ensureMindARLoaded();
        if (!isCancelled) {
          setLoadError(null);
          setIsSceneReady(true);
          onArReadyChange?.(false);
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : "Unable to initialize MindAR");
          onArReadyChange?.(false);
        }
      }
    };

    bootstrap();

    return () => {
      isCancelled = true;
      onArReadyChange?.(false);
    };
  }, [onArReadyChange]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !isSceneReady) {
      return;
    }

    const mindarSystem = scene.systems?.["mindar-image-system"];
    if (!mindarSystem || mindarSystem.__safeStopPatched) {
      return;
    }

    const originalStop = mindarSystem.stop?.bind(mindarSystem);
    const originalPause = mindarSystem.pause?.bind(mindarSystem);
    const originalUnpause = mindarSystem.unpause?.bind(mindarSystem);

    mindarSystem.stop = () => {
      if (!mindarSystem.video || !mindarSystem.video.srcObject) {
        return;
      }

      try {
        originalStop?.();
      } catch {
        // MindAR stop throws when teardown races with initialization.
      }
    };

    mindarSystem.pause = (keepVideo = false) => {
      try {
        originalPause?.(keepVideo);
      } catch {
        if (!keepVideo) {
          mindarSystem.video?.pause?.();
        }
        mindarSystem.controller?.stopProcessVideo?.();
      }
    };

    mindarSystem.unpause = () => {
      try {
        originalUnpause?.();
      } catch {
        if (mindarSystem.video && mindarSystem.controller?.processVideo) {
          mindarSystem.video.play?.();
          mindarSystem.controller.processVideo(mindarSystem.video);
        }
      }
    };

    mindarSystem.__safeStopPatched = true;
  }, [isSceneReady]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !isSceneReady) {
      return;
    }

    const handleArReady = () => {
      setIsArReady(true);
      setLoadError(null);
      onArReadyChange?.(true);
    };

    const handleArError = () => {
      setLoadError("Unable to start camera AR. Check camera permission and target file URL.");
      setIsArReady(false);
      onArReadyChange?.(false);
    };

    scene.addEventListener("arReady", handleArReady as EventListener);
    scene.addEventListener("arError", handleArError as EventListener);

    return () => {
      scene.removeEventListener("arReady", handleArReady as EventListener);
      scene.removeEventListener("arError", handleArError as EventListener);
    };
  }, [isSceneReady, onArReadyChange]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !isSceneReady) {
      return;
    }

    const mindarSystem = scene.systems?.["mindar-image-system"];
    if (!mindarSystem) {
      return;
    }

    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      setHasStarted(true);
      setIsArReady(false);
      onArReadyChange?.(false);
      try {
        mindarSystem.start?.();
      } catch {
        setLoadError("Unable to start camera AR. Please retry.");
        setIsArReady(false);
        onArReadyChange?.(false);
      }
      return;
    }

    if (!isArReady) {
      return;
    }

    if (scanningEnabled) {
      mindarSystem.unpause?.();
      return;
    }

    mindarSystem.pause?.(true);
  }, [isArReady, isSceneReady, scanningEnabled, onArReadyChange]);

  useEffect(() => {
    const scene = sceneRef.current;

    return () => {
      const mindarSystem = scene?.systems?.["mindar-image-system"];
      if (!mindarSystem) {
        return;
      }

      if (hasStartedRef.current && isArReady) {
        mindarSystem.pause?.(true);
      }

      mindarSystem.stop?.();
    };
  }, [isArReady]);

  useEffect(() => {
    const cleanups = trackedTargetIndexes.map((targetIndex) => {
      const targetEntity = targetEntityRefs.current[targetIndex];
      if (!targetEntity) {
        return null;
      }

      const handleTargetFound = () => {
        onTargetFound(targetIndex);
      };

      targetEntity.addEventListener("targetFound", handleTargetFound);

      return () => {
        targetEntity.removeEventListener("targetFound", handleTargetFound);
      };
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup?.());
    };
  }, [onTargetFound, trackedTargetIndexes]);

  if (loadError) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-[20px] border border-[#ff6b00]/40 bg-[#111] p-5 text-center text-sm text-white/75">
        {loadError}
      </div>
    );
  }

  if (!isSceneReady) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-[20px] border border-white/10 bg-[#111]">
        <div className="text-center">
          <p className="text-sm text-white/50">Preparing MindAR camera scene...</p>
          <span className="mt-3 inline-block h-8 w-8 rounded-full border border-white/20 border-t-white/70 anim-soft-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full min-h-[360px] overflow-hidden rounded-[20px] border border-white/10 bg-transparent sm:min-h-[420px]">
      <a-scene
        className="h-full w-full"
        color-space="sRGB"
        embedded
        background="color: transparent"
        mindar-image={mindArAttr}
        ref={(node: MindARSceneElement | null) => {
          sceneRef.current = node;
        }}
        renderer="colorManagement: true; physicallyCorrectLights: true; alpha: true"
        style={{ width: "100%", height: "100%" }}
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
      >
        <a-camera camera="fov: 60" position="0 0 0" look-controls="enabled: false" />
        {trackedTargetIndexes.map((targetIndex) => (
          <a-entity
            key={targetIndex}
            mindar-image-target={`targetIndex: ${targetIndex}`}
            ref={(node: HTMLElement | null) => {
              targetEntityRefs.current[targetIndex] = node;
            }}
          >
            <a-plane color="#00d4ff" height="0.65" opacity="0.58" position="0 0 0" width="1" />
            <a-text
              align="center"
              color="#ffffff"
              value={`Station ${targetIndex} matched`}
              width="2"
              position="0 -0.45 0"
            />
          </a-entity>
        ))}
      </a-scene>

      {hasStarted && !isArReady ? (
        <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center bg-black/45">
          <div className="rounded-[14px] border border-white/15 bg-black/65 px-4 py-3 text-center backdrop-blur-sm">
            <span className="mx-auto block h-8 w-8 rounded-full border border-white/20 border-t-white/85 anim-soft-spin" />
            <p className="mt-2 text-xs tracking-[0.08em] text-white/70">Loading camera...</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}


