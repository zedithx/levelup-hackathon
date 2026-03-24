"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";

import { cn } from "@/components/drawing-game/flow/utils";

const CANVAS_BACKGROUND = "#fefefe";
const STROKE_COLOR = "#141414";
const STROKE_WIDTH = 4;

export type SketchCanvasHandle = {
  exportPng: () => string;
  clear: () => void;
};

type SketchCanvasProps = {
  className?: string;
  disabled?: boolean;
  onStrokeEnd?: (snapshot: string) => void;
};

type Point = {
  x: number;
  y: number;
};

export const SketchCanvas = forwardRef<SketchCanvasHandle, SketchCanvasProps>(function SketchCanvas(
  { className, disabled = false, onStrokeEnd }: SketchCanvasProps,
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const strokeEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const configureContext = useCallback((context: CanvasRenderingContext2D) => {
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = STROKE_COLOR;
    context.lineWidth = STROKE_WIDTH;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.fillStyle = CANVAS_BACKGROUND;
    context.fillRect(0, 0, canvas.width, canvas.height);
    configureContext(context);

    if (onStrokeEnd) {
      onStrokeEnd(canvas.toDataURL("image/png"));
    }
  }, [configureContext, onStrokeEnd]);

  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.floor(cssWidth));
    const nextHeight = Math.max(1, Math.floor(cssHeight));

    if (canvas.width === nextWidth && canvas.height === nextHeight) {
      return;
    }

    const previous = canvas.width > 0 && canvas.height > 0 ? canvas.toDataURL("image/png") : null;

    canvas.width = nextWidth;
    canvas.height = nextHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.fillStyle = CANVAS_BACKGROUND;
    context.fillRect(0, 0, nextWidth, nextHeight);
    configureContext(context);

    if (previous) {
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0, nextWidth, nextHeight);
      };
      image.src = previous;
    }
  }, [configureContext]);

  useEffect(() => {
    syncCanvasSize();
    window.addEventListener("resize", syncCanvasSize);

    return () => {
      window.removeEventListener("resize", syncCanvasSize);
      if (strokeEndTimerRef.current !== null) {
        clearTimeout(strokeEndTimerRef.current);
      }
    };
  }, [syncCanvasSize]);

  useImperativeHandle(
    ref,
    () => ({
      exportPng() {
        const canvas = canvasRef.current;
        if (!canvas) {
          return "";
        }

        return canvas.toDataURL("image/png");
      },
      clear() {
        clearCanvas();
      }
    }),
    [clearCanvas]
  );

  const pointFromEvent = (event: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const box = canvas.getBoundingClientRect();
    return {
      x: event.clientX - box.left,
      y: event.clientY - box.top
    };
  };

  const beginStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);

    context.beginPath();
    context.moveTo(point.x, point.y);
    setIsDrawing(true);
  };

  const continueStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled || !isDrawing) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const point = pointFromEvent(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const endStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled || !isDrawing) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (context) {
      context.closePath();
    }

    setIsDrawing(false);

    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    if (onStrokeEnd) {
      // Debounce the expensive toDataURL encoding — rapid short strokes are
      // batched into a single snapshot 80 ms after the last pointer-up.
      if (strokeEndTimerRef.current !== null) clearTimeout(strokeEndTimerRef.current);
      strokeEndTimerRef.current = setTimeout(() => {
        strokeEndTimerRef.current = null;
        if (canvasRef.current) onStrokeEnd(canvasRef.current.toDataURL("image/png"));
      }, 80);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <div className="inline-flex items-center gap-2 rounded-lg border border-[#00d4ff]/30 bg-[rgba(0,212,255,0.12)] px-2 py-1">
          <span className="text-sm" aria-hidden>
            ✏️
          </span>
          <span className="text-xs font-bold tracking-[0.06em] text-[#00d4ff]">PEN</span>
        </div>
        <button
          className="h-8 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-bold text-white/70 transition-colors hover:border-[#ff6b00]/40 hover:text-white"
          onClick={clearCanvas}
          type="button"
        >
          CLEAR
        </button>
      </div>

      <canvas
        aria-label="Drawing canvas"
        className={cn(
          "h-56 w-full rounded-2xl border border-white/15 bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]",
          disabled ? "opacity-70" : "",
          "touch-none"
        )}
        onPointerDown={beginStroke}
        onPointerLeave={endStroke}
        onPointerMove={continueStroke}
        onPointerUp={endStroke}
        ref={canvasRef}
      />
    </div>
  );
});
