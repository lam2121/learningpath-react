import { useEffect, useRef, useState } from "react";
import { Mic, Sparkles, Target, Volume2, X } from "lucide-react";

import type { PronunciationResponse } from "@/feature/audio/audioApi";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/shadcn/component/ui/dialog";
import { ScrollArea } from "@/shadcn/component/ui/scroll-area";
import { Badge } from "@/shadcn/component/ui/badge";
import { Button } from "@/shadcn/component/ui/button";

import {
    ColoredPronunciationText,
    MarkdownComment,
} from "./PronunciationPractice";

// ── Score Ring ────────────────────────────────────────────────────────────────
// Animated SVG radial progress that fills on mount.

function ScoreRing({
    score,
    tone,
}: {
    score: number;
    tone: string;
}) {
    const [animatedScore, setAnimatedScore] = useState(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const start = performance.now();
        const duration = 800; // ms

        function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedScore(Math.round(eased * score));
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            }
        }
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [score]);

    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (animatedScore / 100) * circumference;

    const strokeColor =
        tone === "emerald"
            ? "stroke-emerald-500"
            : tone === "blue"
            ? "stroke-blue-500"
            : "stroke-amber-500";

    const textColor =
        tone === "emerald"
            ? "text-emerald-600 dark:text-emerald-400"
            : tone === "blue"
            ? "text-blue-600 dark:text-blue-400"
            : "text-amber-600 dark:text-amber-400";

    const glowColor =
        tone === "emerald"
            ? "drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]"
            : tone === "blue"
            ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]"
            : "drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]";

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg
                className={`-rotate-90 ${glowColor}`}
                width="128"
                height="128"
                viewBox="0 0 128 128"
            >
                {/* Background ring */}
                <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="none"
                    strokeWidth="8"
                    className="stroke-slate-200 dark:stroke-slate-700"
                />
                {/* Animated progress ring */}
                <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className={`${strokeColor} transition-all duration-700`}
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-black tabular-nums ${textColor}`}>
                    {animatedScore}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    / 100
                </span>
            </div>
        </div>
    );
}

// ── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone: string;
}) {
    const bg =
        tone === "emerald"
            ? "bg-emerald-50 dark:bg-emerald-950/40"
            : tone === "blue"
            ? "bg-blue-50 dark:bg-blue-950/40"
            : "bg-amber-50 dark:bg-amber-950/40";
    const text =
        tone === "emerald"
            ? "text-emerald-700 dark:text-emerald-300"
            : tone === "blue"
            ? "text-blue-700 dark:text-blue-300"
            : "text-amber-700 dark:text-amber-300";

    return (
        <div className={`rounded-xl ${bg} px-3.5 py-2 text-center`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {label}
            </p>
            <p className={`text-sm font-bold ${text}`}>{value}</p>
        </div>
    );
}

// ── Main Dialog ──────────────────────────────────────────────────────────────

export interface PronunciationFeedbackDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    result: PronunciationResponse;
    item: {
        term: string;
        /** Omitted for Section 3 phrase examples, which are whole sentences. */
        ipa?: string;
        partOfSpeech?: string;
        meaning?: string;
    };
    audioUrl?: string;
    onRecordAgain?: () => void;
}

export function PronunciationFeedbackDialog({
    open,
    onOpenChange,
    result,
    item,
    audioUrl,
    onRecordAgain,
}: PronunciationFeedbackDialogProps) {
    const score = Math.round(result.score);
    const tone = score >= 80 ? "emerald" : score >= 60 ? "blue" : "amber";

    const headerGradient =
        tone === "emerald"
            ? "from-emerald-50/80 via-white to-teal-50/60 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/30"
            : tone === "blue"
            ? "from-blue-50/80 via-white to-indigo-50/60 dark:from-blue-950/40 dark:via-slate-900 dark:to-indigo-950/30"
            : "from-amber-50/80 via-white to-orange-50/60 dark:from-amber-950/40 dark:via-slate-900 dark:to-orange-950/30";

    const toneBorder =
        tone === "emerald"
            ? "border-emerald-200 dark:border-emerald-800"
            : tone === "blue"
            ? "border-blue-200 dark:border-blue-800"
            : "border-amber-200 dark:border-amber-800";

    const handleRecordAgain = () => {
        onOpenChange(false);
        onRecordAgain?.();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="max-h-[90vh] max-w-[560px] overflow-hidden rounded-2xl border-0 bg-white/95 p-0 shadow-2xl backdrop-blur-xl dark:bg-slate-900/95 sm:rounded-3xl"
            >
                {/* Accessible title (visually hidden, rendered inside the gradient header) */}
                <DialogTitle className="sr-only">
                    Pronunciation Analysis — {item.term}
                </DialogTitle>

                <ScrollArea className="max-h-[90vh]">
                    <div className="flex flex-col">
                        {/* ── Header: Score Ring + Word Info ───────────────── */}
                        <div
                            className={`relative bg-gradient-to-br ${headerGradient} px-6 pb-6 pt-5`}
                        >
                            {/* Close button */}
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-600 dark:hover:bg-slate-700/60 dark:hover:text-slate-300"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            {/* Eyebrow */}
                            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                                <Sparkles className="h-3.5 w-3.5" />
                                AI Pronunciation Analysis
                            </p>

                            <div className="mt-4 flex items-center gap-5">
                                <ScoreRing score={score} tone={tone} />

                                <div className="flex-1 space-y-2">
                                    <h3 className="text-2xl font-black text-slate-950 dark:text-white">
                                        {item.term}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {item.ipa && (
                                            <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                                                {item.ipa}
                                            </span>
                                        )}
                                        {item.partOfSpeech && (
                                            <Badge variant="outline" className="text-[10px]">
                                                {item.partOfSpeech}
                                            </Badge>
                                        )}
                                    </div>
                                    {item.meaning && (
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                            {item.meaning}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="mt-4 grid grid-cols-3 gap-2">
                                <StatPill
                                    label="Score"
                                    value={`${score}/100`}
                                    tone={tone}
                                />
                                <StatPill
                                    label="Word Accuracy"
                                    value={`${Math.round((1 - result.word_error_rate) * 100)}%`}
                                    tone={tone}
                                />
                                <StatPill
                                    label="Sound Accuracy"
                                    value={`${Math.round((1 - result.phoneme_error_rate) * 100)}%`}
                                    tone={tone}
                                />
                            </div>
                        </div>

                        {/* ── Body ─────────────────────────────────────────── */}
                        <div className="space-y-5 px-6 pb-6 pt-5">
                            {/* Colored pronunciation text */}
                            {result.errors.length > 0 && (
                                <section>
                                    <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        <Target className="h-3.5 w-3.5" />
                                        Your Pronunciation
                                    </h4>
                                    <ColoredPronunciationText
                                        expectedText={result.expected_text}
                                        errors={result.errors}
                                    />
                                </section>
                            )}

                            {/* What we heard */}
                            {result.transcript && (
                                <div
                                    className={`rounded-xl border ${toneBorder} bg-slate-50/80 px-4 py-3 dark:bg-slate-800/60`}
                                >
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        We heard:
                                    </p>
                                    <p className="mt-0.5 text-sm font-semibold italic text-slate-800 dark:text-slate-200">
                                        &ldquo;{result.transcript}&rdquo;
                                    </p>
                                </div>
                            )}

                            {/* AI Coaching Feedback — the main attraction */}
                            {result.feedback_summary && (
                                <section
                                    className={`rounded-2xl border ${toneBorder} bg-gradient-to-br from-indigo-50/40 via-white to-violet-50/40 p-5 dark:from-indigo-950/20 dark:via-slate-900 dark:to-violet-950/20`}
                                >
                                    <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        AI Coach Feedback
                                    </h4>
                                    <div className="text-sm leading-6 text-slate-800 dark:text-slate-200">
                                        <MarkdownComment text={result.feedback_summary} />
                                    </div>
                                </section>
                            )}

                            {!result.llm_feedback_available && (
                                <p className="text-xs italic text-slate-500 dark:text-slate-400">
                                    Detailed AI coaching is unavailable right now, but your
                                    scores above are accurate.
                                </p>
                            )}

                            {/* Audio playback */}
                            {audioUrl && (
                                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                                    <Volume2 className="h-4 w-4 shrink-0 text-slate-500" />
                                    <audio
                                        src={audioUrl}
                                        controls
                                        className="h-8 w-full max-w-[320px]"
                                    />
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                {onRecordAgain && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRecordAgain}
                                        className="gap-2"
                                    >
                                        <Mic className="h-4 w-4" />
                                        Record Again
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
