import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Loader2, Mic, MicOff, RotateCcw, Sparkles } from "lucide-react";

import type { PronunciationWordError, VocabWordContext } from "@/feature/audio/audioApi";
import type { PronunciationRecorder } from "@/feature/audio/usePronunciationRecorder";
import { renderInlineTokens } from "@/feature/lesson-workspace/util/documentTokenUtils";
import { Button } from "@/shadcn/component/ui/button";
import { AudioWaveformVisualizer } from "./AudioWaveformVisualizer";

/**
 * Record-and-score control for a single target sentence.
 *
 * Shared by Section 2 (word cards, drill sentences) and Section 3 (phrase
 * examples). The recorder is owned by the parent section so one microphone is
 * shared across all the targets in that section.
 *
 * `wordContext` is only set by the Section 2 word cards, where the target is a
 * single vocabulary term and the backend should coach it word-by-word.
 */
export function PronunciationPractice({
    id,
    targetText,
    recorder,
    wordContext,
    onViewDetails,
}: {
    id: string;
    targetText: string;
    recorder: PronunciationRecorder;
    wordContext?: VocabWordContext;
    /** Called when the user clicks "View Full AI Analysis". */
    onViewDetails?: () => void;
}) {
    const isActive = recorder.activeId === id;
    const isRecording = isActive && recorder.isRecording;
    const isEvaluating = recorder.evaluatingId === id;
    const result = recorder.results[id];
    const error = recorder.errors[id];
    const audioUrl = recorder.audioUrls[id];
    const hasTake = Boolean(recorder.blobs[id]);

    // Same thresholds the existing AI Feedback cards use elsewhere in LessonPage.
    const tone = (score: number) =>
        score >= 80 ? "emerald" : score >= 60 ? "blue" : "amber";

    return (
        <div className="mt-3 w-full min-w-0">
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => (isRecording ? recorder.stop() : void recorder.start(id))}
                    disabled={isEvaluating}
                >
                    {isRecording ? (
                        <>
                            <MicOff className="mr-2 h-4 w-4 animate-pulse" />
                            Stop ({recorder.seconds}s)
                        </>
                    ) : (
                        <>
                            <Mic className="mr-2 h-4 w-4" />
                            {hasTake ? "Record again" : "Record yourself"}
                        </>
                    )}
                </Button>

                {hasTake && !isRecording && (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void recorder.evaluate(id, targetText, wordContext)}
                            // One score per take: recording again clears `result`. A failed
                            // attempt leaves no result, so the learner can retry it.
                            disabled={isEvaluating || Boolean(result)}
                        >
                            {isEvaluating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Scoring...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Get feedback
                                </>
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => recorder.reset(id)}
                            disabled={isEvaluating}
                            title="Clear this recording"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </>
                )}
            </div>

            {/* Live waveform visualizer during recording */}
            <AudioWaveformVisualizer
                stream={recorder.activeStream}
                isRecording={isRecording}
            />

            {/* Inline audio playback (only when not recording and no result yet) */}
            {audioUrl && !isRecording && !result && (
                <div className="mt-2 flex items-center gap-2">
                    <audio src={audioUrl} controls className="h-8 max-w-[220px]" />
                </div>
            )}

            {error && (
                <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>
            )}

            {isEvaluating && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Analysing your pronunciation sound by sound. The first attempt can take
                    a little longer while the models load.
                </p>
            )}

            {result && (
                <PronunciationResult
                    result={result}
                    tone={tone}
                    onViewDetails={onViewDetails}
                    audioUrl={audioUrl}
                />
            )}
        </div>
    );
}

// ── ELSA-style word coloring ─────────────────────────────────────────────────
// Each word in the expected text is classified by how well the learner
// pronounced it: "correct" (green), "close" (yellow), or "wrong" (red).
// The classification is derived from the engine's per-word error list:
//   • A word that does NOT appear in errors at all → correct
//   • A word whose error confidence < 0.45 → close (nearly right)
//   • A word whose error confidence ≥ 0.45 → wrong


export type WordGrade = "correct" | "close" | "wrong";

export interface GradedWord {
    word: string;
    grade: WordGrade;
    /** The matching engine error entry, if any */
    error?: PronunciationWordError;
}

/**
 * Build a per-word grading array by matching `expectedText` words
 * against the engine's error list. Matching is case-insensitive and
 * position-aware so duplicate words in a sentence are graded individually.
 */
export function gradeWords(
    expectedText: string,
    errors: PronunciationWordError[],
): GradedWord[] {
    const words = expectedText.split(/\s+/).filter(Boolean);

    // Index errors by position first (engine gives 0-based index into expected words),
    // then fall back to case-insensitive word match for engines that don't report position.
    const byPosition = new Map<number, PronunciationWordError>();
    const byWord = new Map<string, PronunciationWordError[]>();
    for (const err of errors) {
        if (err.position != null && err.position >= 0) {
            byPosition.set(err.position, err);
        }
        const key = err.word.toLowerCase().replace(/[^a-z0-9'-]/g, "");
        if (!byWord.has(key)) byWord.set(key, []);
        byWord.get(key)!.push(err);
    }

    const usedFallback = new Set<PronunciationWordError>();

    return words.map((word, idx): GradedWord => {
        // Try position match first
        let match = byPosition.get(idx);

        // Fall back to word match
        if (!match) {
            const key = word.toLowerCase().replace(/[^a-z0-9'-]/g, "");
            const candidates = byWord.get(key);
            if (candidates) {
                match = candidates.find((c) => !usedFallback.has(c));
                if (match) usedFallback.add(match);
            }
        }

        if (!match) return { word, grade: "correct" };

        const grade: WordGrade = match.confidence >= 0.45 ? "wrong" : "close";
        return { word, grade, error: match };
    });
}

// Color mappings for the three grades – ELSA-style vibrant colors
export const GRADE_STYLES: Record<
    WordGrade,
    { text: string; bg: string; border: string; label: string }
> = {
    correct: {
        text: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        border: "border-emerald-200 dark:border-emerald-800",
        label: "Correct",
    },
    close: {
        text: "text-amber-600 dark:text-amber-500",
        bg: "bg-amber-50 dark:bg-amber-950/40",
        border: "border-amber-200 dark:border-amber-800",
        label: "Nearly right",
    },
    wrong: {
        text: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-50 dark:bg-rose-950/40",
        border: "border-rose-200 dark:border-rose-800",
        label: "Needs work",
    },
};

/**
 * ELSA Speak-style colored word display.
 *
 * Renders the expected text with each word colored green / yellow / red.
 * Tapping a yellow or red word opens a detail panel showing the IPA
 * breakdown (expected → heard) for that word.
 */
export function ColoredPronunciationText({
    expectedText,
    errors,
}: {
    expectedText: string;
    errors: PronunciationWordError[];
}) {
    const graded = gradeWords(expectedText, errors);
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    return (
        <div className="mt-4">
            {/* Color legend */}
            <div className="mb-2.5 flex flex-wrap items-center gap-3 text-[11px] font-medium">
                {(["correct", "close", "wrong"] as const).map((g) => (
                    <span key={g} className="flex items-center gap-1.5">
                        <span
                            className={`inline-block h-2.5 w-2.5 rounded-full ${
                                g === "correct"
                                    ? "bg-emerald-500"
                                    : g === "close"
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                            }`}
                        />
                        <span className="text-slate-600 dark:text-slate-400">
                            {GRADE_STYLES[g].label}
                        </span>
                    </span>
                ))}
            </div>

            {/* Colored words */}
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-900/80">
                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-lg font-semibold leading-relaxed tracking-wide">
                    {graded.map((g, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (g.grade !== "correct") {
                                    setExpandedIdx(expandedIdx === idx ? null : idx);
                                }
                            }}
                            className={`relative cursor-default rounded-md px-1 py-0.5 transition-all duration-200 ${
                                GRADE_STYLES[g.grade].text
                            } ${
                                g.grade !== "correct"
                                    ? "cursor-pointer hover:scale-105 hover:shadow-sm"
                                    : ""
                            } ${
                                expandedIdx === idx
                                    ? `ring-2 ${
                                          g.grade === "close"
                                              ? "ring-amber-400 dark:ring-amber-600"
                                              : "ring-rose-400 dark:ring-rose-600"
                                      }`
                                    : ""
                            }`}
                            title={
                                g.grade === "correct"
                                    ? "Great pronunciation!"
                                    : `Tap to see details`
                            }
                        >
                            {/* Render each letter with individual coloring when phoneme data available */}
                            {g.error?.phones && g.error.phones.length > 0
                                ? renderLettersWithPhonemeHints(g.word, g.error)
                                : g.word}

                            {/* Underline indicator for non-correct words */}
                            {g.grade !== "correct" && (
                                <span
                                    className={`absolute bottom-0 left-1 right-1 h-[2px] rounded-full ${
                                        g.grade === "close"
                                            ? "bg-amber-400/60 dark:bg-amber-500/50"
                                            : "bg-rose-400/60 dark:bg-rose-500/50"
                                    }`}
                                />
                            )}
                        </button>
                    ))}
                </p>

                {/* Expanded IPA detail for the tapped word */}
                {expandedIdx != null && graded[expandedIdx]?.error && (
                    <WordIpaDetail
                        gradedWord={graded[expandedIdx]}
                        onClose={() => setExpandedIdx(null)}
                    />
                )}
            </div>
        </div>
    );
}

/**
 * When phoneme data is available, split the word's letters into segments and
 * hint their correctness. This is a best-effort mapping: the engine reports
 * phonemes (IPA), not graphemes, so we distribute the per-phone confidences
 * across the word's letters proportionally.
 */
export function renderLettersWithPhonemeHints(
    word: string,
    error: PronunciationWordError,
) {
    const phones = error.phones;
    if (!phones.length) return word;

    const letters = word.split("");
    // Distribute phones evenly across letters (grapheme ≠ phoneme, but this
    // gives a reasonable visual hint for the learner).
    const ratio = phones.length / letters.length;

    return letters.map((letter, i) => {
        const phoneIdx = Math.min(Math.floor(i * ratio), phones.length - 1);
        const phone = phones[phoneIdx];
        const conf = phone?.confidence ?? 0;

        // Determine letter-level color: same thresholds as word-level
        const letterColor =
            conf < 0.3
                ? "text-emerald-600 dark:text-emerald-400"
                : conf < 0.6
                ? "text-amber-600 dark:text-amber-500"
                : "text-rose-600 dark:text-rose-400";

        return (
            <span key={i} className={letterColor}>
                {letter}
            </span>
        );
    });
}

/** Detail panel showing expected vs heard IPA for a single word */
export function WordIpaDetail({
    gradedWord,
    onClose,
}: {
    gradedWord: GradedWord;
    onClose: () => void;
}) {
    const err = gradedWord.error!;
    const style = GRADE_STYLES[gradedWord.grade];

    return (
        <div
            className={`mt-3 rounded-xl border ${style.border} ${style.bg} p-3.5 animate-in fade-in slide-in-from-top-1 duration-200`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`text-base font-bold ${style.text}`}>
                        {err.word}
                    </span>
                    <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text} border ${style.border}`}
                    >
                        {style.label}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 dark:hover:bg-slate-700/60 dark:hover:text-slate-300"
                    aria-label="Close detail"
                >
                    ✕
                </button>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-white/80 px-3 py-2 dark:bg-slate-800/80">
                    <p className="mb-1 font-semibold text-slate-500 dark:text-slate-400">
                        Expected
                    </p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        /{err.expected_ipa}/
                    </p>
                </div>
                <div className="rounded-lg bg-white/80 px-3 py-2 dark:bg-slate-800/80">
                    <p className="mb-1 font-semibold text-slate-500 dark:text-slate-400">
                        You said
                    </p>
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                        {err.heard_ipa ? `/${err.heard_ipa}/` : "(silent)"}
                    </p>
                </div>
            </div>

            {/* Per-phoneme breakdown chips */}
            {err.phones.length > 0 && (
                <div className="mt-2.5">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Sound-by-sound
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {err.phones.map((p, idx) => {
                            const phoneGrade: WordGrade =
                                p.confidence < 0.3
                                    ? "correct"
                                    : p.confidence < 0.6
                                    ? "close"
                                    : "wrong";
                            const ps = GRADE_STYLES[phoneGrade];
                            return (
                                <span
                                    key={idx}
                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${ps.border} ${ps.bg}`}
                                >
                                    <span className={`font-bold ${ps.text}`}>
                                        /{p.expected}/
                                    </span>
                                    {p.heard && p.heard !== p.expected && (
                                        <>
                                            <span className="text-slate-400">→</span>
                                            <span className="text-rose-600 dark:text-rose-400">
                                                /{p.heard}/
                                            </span>
                                        </>
                                    )}
                                    {!p.heard && (
                                        <>
                                            <span className="text-slate-400">→</span>
                                            <span className="italic text-slate-400">
                                                silent
                                            </span>
                                        </>
                                    )}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Compact Score Ring (64px) ─────────────────────────────────────────────────

function CompactScoreRing({ score, tone }: { score: number; tone: string }) {
    const [animatedScore, setAnimatedScore] = useState(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const start = performance.now();
        const duration = 700;

        function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedScore(Math.round(eased * score));
            if (progress < 1) rafRef.current = requestAnimationFrame(tick);
        }
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [score]);

    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (animatedScore / 100) * circumference;

    const strokeColor =
        tone === "emerald" ? "stroke-emerald-500"
        : tone === "blue" ? "stroke-blue-500"
        : "stroke-amber-500";

    const textColor =
        tone === "emerald" ? "text-emerald-600 dark:text-emerald-400"
        : tone === "blue" ? "text-blue-600 dark:text-blue-400"
        : "text-amber-600 dark:text-amber-400";

    const glowColor =
        tone === "emerald" ? "drop-shadow-[0_0_6px_rgba(16,185,129,0.35)]"
        : tone === "blue" ? "drop-shadow-[0_0_6px_rgba(59,130,246,0.35)]"
        : "drop-shadow-[0_0_6px_rgba(245,158,11,0.35)]";

    return (
        <div className="relative inline-flex shrink-0 items-center justify-center">
            <svg className={`-rotate-90 ${glowColor}`} width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="5"
                    className="stroke-slate-200 dark:stroke-slate-700" />
                <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="5"
                    strokeLinecap="round" className={`${strokeColor} transition-all duration-500`}
                    style={{ strokeDasharray: circumference, strokeDashoffset: offset }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-base font-black tabular-nums leading-none ${textColor}`}>
                    {animatedScore}
                </span>
                <span className="text-[8px] font-semibold text-slate-400 dark:text-slate-500">/100</span>
            </div>
        </div>
    );
}

// ── Compact Colored Words ────────────────────────────────────────────────────
// Simpler version — no legend, no tap-to-expand detail panel.

function CompactColoredWords({
    expectedText,
    errors,
}: {
    expectedText: string;
    errors: PronunciationWordError[];
}) {
    const graded = gradeWords(expectedText, errors);
    return (
        <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm font-semibold leading-relaxed">
            {graded.map((g, idx) => (
                <span key={idx} className={`rounded px-0.5 ${GRADE_STYLES[g.grade].text}`}>
                    {g.error?.phones && g.error.phones.length > 0
                        ? renderLettersWithPhonemeHints(g.word, g.error)
                        : g.word}
                </span>
            ))}
        </p>
    );
}

// ── Quick verdict label ──────────────────────────────────────────────────────

function quickLabel(score: number): string {
    if (score >= 90) return "Excellent!";
    if (score >= 80) return "Great job!";
    if (score >= 70) return "Good effort!";
    if (score >= 60) return "Getting there!";
    if (score >= 40) return "Keep practising!";
    return "I know you can do it better!";
}

// ── Main result card (COMPACT) ───────────────────────────────────────────────

export function PronunciationResult({
    result,
    tone,
    onViewDetails,
    audioUrl,
}: {
    result: NonNullable<PronunciationRecorder["results"][string]>;
    tone: (score: number) => string;
    /** Called when the user clicks "Full Review". */
    onViewDetails?: () => void;
    /** Playback URL for the user's recording. */
    audioUrl?: string;
}) {
    const score = Math.round(result.score);
    const t = tone(score);

    const borderColor =
        t === "emerald" ? "border-emerald-200 dark:border-emerald-800/60"
        : t === "blue" ? "border-blue-200 dark:border-blue-800/60"
        : "border-amber-200 dark:border-amber-800/60";

    const bgGradient =
        t === "emerald" ? "from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/20 dark:to-teal-950/10"
        : t === "blue" ? "from-blue-50/60 to-indigo-50/40 dark:from-blue-950/20 dark:to-indigo-950/10"
        : "from-amber-50/60 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10";

    const labelColor =
        t === "emerald" ? "text-emerald-700 dark:text-emerald-300"
        : t === "blue" ? "text-blue-700 dark:text-blue-300"
        : "text-amber-700 dark:text-amber-300";

    return (
        <div className={`mt-3 rounded-2xl border ${borderColor} bg-gradient-to-br ${bgGradient} p-4 animate-in fade-in slide-in-from-top-2 duration-300`}>
            {/* Row: Score ring + quick verdict */}
            <div className="flex items-center gap-4">
                <CompactScoreRing score={score} tone={t} />
                <div className="min-w-0 flex-1">
                    <p className={`text-base font-bold ${labelColor}`}>
                        {quickLabel(score)}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {onViewDetails ? 'Tap "Full Review" for AI coaching' : 'Pronunciation scored'}
                    </p>
                </div>
            </div>

            {/* Compact colored words */}
            <div className="mt-3 rounded-xl border border-slate-200/60 bg-white/80 px-3 py-2.5 dark:border-slate-700/40 dark:bg-slate-900/60">
                <CompactColoredWords
                    expectedText={result.expected_text}
                    errors={result.errors}
                />
            </div>

            {/* Inline audio playback */}
            {audioUrl && (
                <div className="mt-2.5 flex items-center gap-2">
                    <audio src={audioUrl} controls className="h-7 w-full max-w-[240px]" />
                </div>
            )}

            {/* Full Review Summary: short recap of the AI feedback, above the CTA */}
            {onViewDetails && result.short_summary && (
                <div className="mt-3 rounded-xl border border-indigo-200/70 bg-white/80 px-3 py-2.5 dark:border-indigo-800/50 dark:bg-slate-900/60">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        <Sparkles className="h-3 w-3" />
                        Full Review Summary
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                        {result.short_summary}
                    </p>
                </div>
            )}

            {/* Full Review CTA */}
            {onViewDetails && (
                <button
                    type="button"
                    onClick={(e: ReactMouseEvent) => {
                        e.stopPropagation();
                        onViewDetails();
                    }}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:from-indigo-600 hover:to-violet-600 hover:shadow-lg active:scale-[0.98] dark:border-indigo-700 dark:from-indigo-600 dark:to-violet-600 dark:hover:from-indigo-500 dark:hover:to-violet-500"
                >
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    Full Review
                </button>
            )}
        </div>
    );
}

/**
 * Minimal markdown rendering for the coach comment.
 *
 * Reuses renderInlineTokens (bold / italic / code) from TechnicalDocumentViewer
 * rather than pulling in a markdown dependency the project does not have.
 */
export function MarkdownComment({ text }: { text: string }) {
    if (!text.trim()) return null;

    const lines = text.split("\n");

    return (
        <div className="mt-3 space-y-1.5">
            {lines.map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return null;

                // Strip markdown heading hashes; F1 emits emoji + bold headers anyway.
                const heading = trimmed.replace(/^#{1,6}\s*/, "");
                const isBullet = /^[-*]\s+/.test(heading);
                const content = isBullet ? heading.replace(/^[-*]\s+/, "") : heading;

                return isBullet ? (
                    <div key={idx} className="flex gap-2 pl-1">
                        <span className="select-none text-indigo-400">&bull;</span>
                        <span>{renderInlineTokens(content)}</span>
                    </div>
                ) : (
                    <p key={idx}>{renderInlineTokens(content)}</p>
                );
            })}
        </div>
    );
}
