import { useEffect, useRef } from "react";

/**
 * Real-time audio waveform visualizer shown during recording.
 *
 * Connects to the recorder's MediaStream via an AnalyserNode and renders
 * animated vertical bars that react to microphone input. Falls back to a
 * CSS-only pulsing animation when AnalyserNode is unavailable.
 *
 * Compact height (48px) — fits neatly inside a vocabulary card's back face.
 */
export function AudioWaveformVisualizer({
    stream,
    isRecording,
    barCount = 20,
}: {
    stream: MediaStream | null;
    isRecording: boolean;
    /** Number of bars to render. Default 20. */
    barCount?: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    useEffect(() => {
        if (!stream || !isRecording) {
            // Clean up when not recording
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
            analyserRef.current = null;
            if (sourceRef.current) {
                try { sourceRef.current.disconnect(); } catch { /* noop */ }
                sourceRef.current = null;
            }
            // Clear canvas
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            return;
        }

        // Set up Web Audio API analyser
        let audioCtx = audioCtxRef.current;
        if (!audioCtx || audioCtx.state === "closed") {
            audioCtx = new AudioContext();
            audioCtxRef.current = audioCtx;
        }

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.75;
        analyserRef.current = analyser;

        try {
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            sourceRef.current = source;
        } catch {
            // Stream may already be ended
            return;
        }

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        function draw() {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            if (width <= 0 || height <= 0) {
                rafRef.current = requestAnimationFrame(draw);
                return;
            }

            const dpr = window.devicePixelRatio || 1;
            const targetWidth = Math.floor(width * dpr);
            const targetHeight = Math.floor(height * dpr);

            if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
                canvas.width = targetWidth;
                canvas.height = targetHeight;
            }

            ctx.save();
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, width, height);

            analyser.getByteFrequencyData(dataArray);

            const gap = 3;
            const barWidth = Math.max(1, (width - gap * (barCount - 1)) / barCount);
            const minBarHeight = 4;
            const maxBarHeight = Math.max(minBarHeight, height - 4);

            // Sample frequencies evenly across the spectrum
            const step = Math.max(1, Math.floor(dataArray.length / barCount));

            for (let i = 0; i < barCount; i++) {
                const dataIdx = Math.min(i * step, dataArray.length - 1);
                const value = dataArray[dataIdx] / 255;
                const barHeight = Math.max(minBarHeight, value * maxBarHeight);

                const x = i * (barWidth + gap);
                const y = (height - barHeight) / 2;

                // Gradient from indigo to violet
                const hue = 240 + (i / barCount) * 30; // 240 (indigo) → 270 (violet)
                const lightness = 50 + value * 15;
                const alpha = 0.6 + value * 0.4;

                ctx.fillStyle = `hsla(${hue}, 70%, ${lightness}%, ${alpha})`;
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
                ctx.fill();
            }

            ctx.restore();

            rafRef.current = requestAnimationFrame(draw);
        }

        rafRef.current = requestAnimationFrame(draw);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
            if (sourceRef.current) {
                try { sourceRef.current.disconnect(); } catch { /* noop */ }
                sourceRef.current = null;
            }
        };
    }, [stream, isRecording, barCount]);

    // Clean up AudioContext on unmount
    useEffect(() => {
        return () => {
            if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
                audioCtxRef.current.close().catch(() => { /* noop */ });
            }
        };
    }, []);

    if (!isRecording) return null;

    return (
        <div className="mt-3 flex w-full min-w-0 items-center gap-3 rounded-xl border border-indigo-200/60 bg-indigo-50/50 px-4 py-3 dark:border-indigo-800/40 dark:bg-indigo-950/20">
            {/* Live indicator dot */}
            <div className="flex shrink-0 items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    REC
                </span>
            </div>

            {/* Waveform canvas wrapper */}
            <div className="relative h-10 flex-1 min-w-0 overflow-hidden">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 h-full w-full"
                    style={{ imageRendering: "auto" }}
                />
            </div>
        </div>
    );
}
