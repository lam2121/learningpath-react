import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
    ArrowLeft,
    BookOpen,
    CircleHelp,
    ClipboardList,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Copy,
    FileText,
    Headphones,
    Languages,
    ListChecks,
    MessageSquareText,
    NotebookPen,
    Play,
    ScrollText,
    Sparkles,
    Square,
    Target,
    Volume2,
    type LucideIcon,
} from "lucide-react";

import { MainNavigationMenu } from "@/common/component/MainNavigationMenu";
import {
    fetchRoadmap,
    type RoadmapLesson,
    type RoadmapResponse,
    type RoadmapTopic,
} from "@/feature/learning-path/roadmapApi";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/shadcn/component/ui/alert-dialog";
import { Badge } from "@/shadcn/component/ui/badge";
import { Button } from "@/shadcn/component/ui/button";
import { Progress } from "@/shadcn/component/ui/progress";
import { FillBlankQuestion } from "@/feature/quiz-engine/component/FillBlankQuestion";
import { MultiSelectQuestion } from "@/feature/quiz-engine/component/MultiSelectQuestion";
import { OrderingQuestion } from "@/feature/quiz-engine/component/OrderingQuestion";
import type {
    FillBlankQuestionData,
    MultiSelectQuestionData,
    OrderingQuestionData,
} from "@/feature/quiz-engine/type/Quiz";
import { LessonSkeleton } from "../component/LessonSkeleton";

function speakText(text: string, onEnd?: () => void) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
    }
    window.speechSynthesis.speak(utterance);
}

function stopSpeech() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
}

function AudioSpeakButton({
    text,
    label,
    className,
}: {
    text: string;
    label?: string;
    className?: string;
}) {
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isPlaying) {
            stopSpeech();
            setIsPlaying(false);
            return;
        }
        setIsPlaying(true);
        speakText(text, () => setIsPlaying(false));
    };

    return (
        <button
            type="button"
            onClick={handlePlay}
            title={label ?? "Listen to pronunciation"}
            className={
                className ??
                "inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50"
            }
        >
            <Volume2
                className={`h-3.5 w-3.5 ${
                    isPlaying
                        ? "animate-pulse text-blue-600 dark:text-blue-400"
                        : ""
                }`}
            />
            {label ? <span>{label}</span> : <span>Listen</span>}
        </button>
    );
}

// Component xử lý toggle ẩn/hiện bản dịch cho phần Do/Don't (hỗ trợ backward compatibility)
function DosDontsArticle({
    pair,
    explanationString,
}: {
    pair: { id: string; left: string; right: string };
    explanationString: string;
}) {
    const [showTranslation, setShowTranslation] = useState(false);
    const explanation = parseMirroredExplanation(explanationString);

    return (
        <article className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                            Do (Recommended)
                        </p>
                        <AudioSpeakButton text={pair.left} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200 font-medium">
                        {pair.left}
                    </p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-950/30">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">
                            Don't (Avoid)
                        </p>
                        <AudioSpeakButton text={pair.right} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                        {pair.right}
                    </p>
                </div>
            </div>

            <div className="mt-5 flex justify-center">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTranslation(!showTranslation)}
                    className="text-slate-600 dark:text-slate-300"
                >
                    <Languages className="mr-2 h-4 w-4" />
                    {showTranslation
                        ? "Ẩn bản dịch (Hide translation)"
                        : "Dịch sang tiếng Việt (Vietnamese Support)"}
                </Button>
            </div>

            {showTranslation && (
                <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800/60 animate-in fade-in slide-in-from-top-2">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        Vietnamese Support
                    </p>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                                Nên làm
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                                {explanation.left}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-950/30">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">
                                Không nên
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                                {explanation.right || explanation.left}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
}

type TheorySectionKey =
    | "scenario"
    | "vocab"
    | "phrases"
    | "reading"
    | "dialogue"
    | "listening"
    | "wrapup"
    | "process"
    | "dos_donts";

type SidebarSectionKey = TheorySectionKey | "quiz";

type QuizRow = [string, string, string, string];

type SectionMeta = {
    key: SidebarSectionKey;
    label: string;
    eyebrow: string;
    icon: LucideIcon;
};

type ParsedTheorySection = {
    key: TheorySectionKey;
    label: string;
    primary: string;
    secondary: string;
    note: string;
};

type ParsedQuiz = {
    fillBlank: QuizRow[];
    multiSelect: QuizRow[];
    ordering: QuizRow[];
};

type LessonLookup = {
    track: string;
    topic: RoadmapTopic;
    lesson: RoadmapLesson;
};

type EmbeddedQuestionType = "fill_blank" | "multi_select" | "ordering";

type EmbeddedQuizQuestion = {
    id: string;
    type: EmbeddedQuestionType;
    data: FillBlankQuestionData | MultiSelectQuestionData | OrderingQuestionData;
};

const SECTION_META: SectionMeta[] = [
    { key: "scenario", label: "Scenario", eyebrow: "Context", icon: ScrollText },
    {
        key: "vocab",
        label: "Vocabulary & Pronunciation",
        eyebrow: "Speaking & Terms",
        icon: Volume2,
    },
    { key: "phrases", label: "Phrases", eyebrow: "Patterns", icon: NotebookPen },
    { key: "reading", label: "Reading", eyebrow: "Document", icon: FileText },
    {
        key: "dialogue",
        label: "Dialogue",
        eyebrow: "Exchange",
        icon: MessageSquareText,
    },
    {
        key: "listening",
        label: "Listening",
        eyebrow: "Audio Track",
        icon: Headphones,
    },
    { key: "wrapup", label: "Wrap-up", eyebrow: "Review", icon: Target },
    { key: "quiz", label: "Quiz", eyebrow: "C-2", icon: CircleHelp },
];

function formatLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function splitPipe(value: string): string[] {
    return value
        .split("|")
        .map((part) =>
            part
                .trim()
                .replace(/^\d+\s*[.):\\-]\s*/, "")
        )
        .filter(Boolean);
}

function splitHash(value: string): string[] {
    return value
        .split("#")
        .map((part) => part.trim())
        .filter(Boolean);
}

function splitDash(value: string, pattern = /\s+-\s+/): string[] {
    return value
        .split(pattern)
        .map((part) => part.trim())
        .filter(Boolean);
}

function parseMaybeJson(value: unknown): unknown {
    if (typeof value !== "string") {
        return value;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return value;
    }

    if (
        (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
        (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
        try {
            return JSON.parse(trimmed);
        } catch {
            return value;
        }
    }

    return value;
}

function findFirstList(value: unknown, depth = 0): unknown[] | null {
    if (Array.isArray(value)) {
        return value;
    }

    if (value && typeof value === "object" && depth < 3) {
        for (const nested of Object.values(value as Record<string, unknown>)) {
            const found = findFirstList(nested, depth + 1);
            if (found) {
                return found;
            }
        }
    }

    return null;
}

function findQuizObject(value: unknown, depth = 0): Record<string, unknown> | null {
    if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        ("fill_blank" in value || "multi_select" in value || "ordering" in value)
    ) {
        return value as Record<string, unknown>;
    }

    if (value && typeof value === "object" && depth < 3) {
        for (const nested of Object.values(value as Record<string, unknown>)) {
            const found = findQuizObject(nested, depth + 1);
            if (found) {
                return found;
            }
        }
    }

    return null;
}

function normalizeTheoryContent(value: unknown): ParsedTheorySection[] | null {
    const parsed = parseMaybeJson(value);
    const rows = findFirstList(parsed);

    if (!rows || (rows.length !== 7 && rows.length !== 8)) {
        return null;
    }

    // 7-section order (New standard)
    if (rows.length === 7) {
        const keys: TheorySectionKey[] = [
            "scenario",
            "vocab",
            "phrases",
            "reading",
            "dialogue",
            "listening",
            "wrapup",
        ];

        const sections = rows
            .map((row, index) => {
                if (!Array.isArray(row) || row.length < 1) {
                    return null;
                }
                const key = keys[index];
                const meta = SECTION_META.find((m) => m.key === key);
                const primary = typeof row[1] === "string" ? row[1] : "";
                const hasFullRow = row.length >= 4;
                const secondary = hasFullRow && typeof row[2] === "string" ? row[2] : "";
                const note = hasFullRow
                    ? typeof row[3] === "string"
                        ? row[3]
                        : ""
                    : typeof row[2] === "string"
                        ? row[2]
                        : "";

                return {
                    key,
                    label: meta?.label ?? formatLabel(key),
                    primary,
                    secondary,
                    note,
                } satisfies ParsedTheorySection;
            })
            .filter((row): row is ParsedTheorySection => row !== null);

        return sections.length === 7 ? sections : null;
    }

    // 8-section legacy order (Backward compatibility)
    const legacyKeys: TheorySectionKey[] = [
        "scenario",
        "vocab",
        "phrases",
        "reading",
        "dialogue",
        "process",
        "dos_donts",
        "wrapup",
    ];

    const sections = rows
        .map((row, index) => {
            if (!Array.isArray(row) || row.length < 1) {
                return null;
            }
            const rawKey = String(row[0]);
            let key = legacyKeys[index] ?? "scenario";
            if (rawKey === "listening") key = "listening";
            else if (rawKey === "process") key = "process";
            else if (rawKey === "dos_donts") key = "dos_donts";

            const meta = SECTION_META.find((m) => m.key === key);
            const primary = typeof row[1] === "string" ? row[1] : "";
            const hasFullRow = row.length >= 4;
            const secondary = hasFullRow && typeof row[2] === "string" ? row[2] : "";
            const note = hasFullRow
                ? typeof row[3] === "string"
                    ? row[3]
                    : ""
                : typeof row[2] === "string"
                    ? row[2]
                    : "";

            return {
                key,
                label: meta?.label ?? formatLabel(key),
                primary,
                secondary,
                note,
            } satisfies ParsedTheorySection;
        })
        .filter((row): row is ParsedTheorySection => row !== null);

    return sections.length >= 7 ? sections : null;
}

function normalizeQuizContent(value: unknown): ParsedQuiz | null {
    const parsed = parseMaybeJson(value);
    const raw = findQuizObject(parsed);
    if (!raw) {
        return null;
    }
    const fillBlank = Array.isArray(raw.fill_blank) ? raw.fill_blank : null;
    const multiSelect = Array.isArray(raw.multi_select) ? raw.multi_select : null;
    const ordering = Array.isArray(raw.ordering) ? raw.ordering : null;

    if (!fillBlank || !multiSelect || !ordering) {
        return null;
    }

    const toRows = (rows: unknown[]): QuizRow[] =>
        rows.filter(
            (row): row is QuizRow =>
                Array.isArray(row) &&
                row.length >= 4 &&
                typeof row[0] === "string" &&
                typeof row[1] === "string" &&
                typeof row[2] === "string" &&
                typeof row[3] === "string",
        );

    return {
        fillBlank: toRows(fillBlank),
        multiSelect: toRows(multiSelect),
        ordering: toRows(ordering),
    };
}

function buildEmbeddedQuizQuestions(quiz: ParsedQuiz | null): EmbeddedQuizQuestion[] {
    if (!quiz) {
        return [];
    }

    return [
        ...quiz.fillBlank.map((row, index) => ({
            id: `fill-${index}`,
            type: "fill_blank" as const,
            data: [...row, 0, 0, 0, 0, 0, 0, 0, 0] as FillBlankQuestionData,
        })),
        ...quiz.multiSelect.map((row, index) => ({
            id: `multi-${index}`,
            type: "multi_select" as const,
            data: [...row, 0, 0, 0, 0, 0, 0, 0, 0] as MultiSelectQuestionData,
        })),
        ...quiz.ordering.map((row, index) => ({
            id: `order-${index}`,
            type: "ordering" as const,
            data: [...row, 0, 0, 0, 0, 0, 0, 0, 0] as OrderingQuestionData,
        })),
    ];
}

function shuffleQuestions<T>(items: T[]) {
    const next = [...items];
    for (let index = next.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    }
    return next;
}

function hasAnswer(answer: string | undefined) {
    return Boolean(answer && answer.trim().length > 0);
}

function normalizeIndexAnswer(answer: string) {
    return answer
        .split("|")
        .map((part) => Number(part.trim()))
        .filter((value) => !Number.isNaN(value))
        .sort((a, b) => a - b)
        .join("|");
}

function isEmbeddedAnswerCorrect(question: EmbeddedQuizQuestion, answer: string | undefined) {
    if (!hasAnswer(answer)) {
        return false;
    }

    if (question.type === "fill_blank") {
        return answer === question.data[2];
    }

    if (question.type === "multi_select") {
        return normalizeIndexAnswer(answer ?? "") === normalizeIndexAnswer(question.data[2]);
    }

    return answer === question.data[2];
}

function parseReadingQuestions(value: string) {
    return value
        .split(/\s*(?:\|+|#)\s*(?=Q\d+\.)/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
            const match = part.match(
                /^(Q\d+\.\s*\*?.*?\*?)\s*\|\|\s*(A\d+\.\s*\*?.*?\*?)$/
            );

            if (!match) {
                return null;
            }

            return {
                question: match[1].trim(),
                answer: match[2].trim(),
            };
        })
        .filter(
            (qa): qa is { question: string; answer: string } => qa !== null
        );
}

function parseDialogueLines(value: string) {
    return value
        .split(/\s*\|\s*|[.?]\s+(?=[^:.?|]+:)/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => {
            const match = line.match(/^([^:]+):\s*\*?(.*?)\*?$/);

            return {
                id: `${index}-${line}`,
                speaker: match?.[1]?.trim() ?? `Speaker ${index + 1}`,
                text: match?.[2]?.trim() ?? line,
            };
        });
}

type DialogueHighlight = {
    id: string;
    left: string;
    right: string;
};

function removeWrappingQuotes(value: string): string {
    const text = value.trim();

    const quotePairs: Record<string, string> = {
        "'": "'",
        '"': '"',
        "“": "”",
        "‘": "’",
    };

    const closingQuote = quotePairs[text.charAt(0)];

    return closingQuote && text.endsWith(closingQuote)
        ? text.slice(1, -1).trim()
        : text;
}

function parseDialogueHighlights(
    value: string,
): DialogueHighlight[] {
    const patterns: RegExp[] = [
        /^(.*?)\s+is\s+effective\s+because\s*:?\s*(.+)$/i,
        /^(.*?)\s*-\s*(?:why\s+it\s+works|it\s+works\s+because)\s*:?\s*(.+)$/i,
        /^(.*?)\s*-\s*((?:shows?|demonstrates?|provides?|emphasizes?)\s+.+)$/i,
        /^(.*?)\s+-\s+(.+)$/,
    ];

    return removeWrappingQuotes(value)
        .split(
            /\s*[|#]\s*|\s*-\s*(?=the\s+phrase\b)|\.\s+(?=the\s+phrase\b)|,\s*(?=['"“‘].*?['"”’]\s*-)/i,
        )
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item, index) => {
            const cleanedItem = item
                .replace(/^key\s+phrases?(?:\s+used)?\s*:\s*/i, "")
                .replace(/^phrases?\s*[-:]\s*/i, "")
                .replace(/^the\s+phrase\s+(?=['"“‘])/i, "")
                .trim();

            const matched = patterns
                .map((pattern) => cleanedItem.match(pattern))
                .find(
                    (match): match is RegExpMatchArray =>
                        match !== null,
                );

            if (!matched) {
                const phrase = removeWrappingQuotes(cleanedItem);

                return {
                    id: `${index}-${phrase}`,
                    left: phrase,
                    right: "",
                };
            }

            const phrase = removeWrappingQuotes(matched[1]);
            const explanation = removeWrappingQuotes(matched[2]);

            return {
                id: `${index}-${phrase}`,
                left: phrase,
                right: explanation,
            };
        });
}

function parseIndexedExplanation(value: string, prefix: "Do" | "Phrase") {
    return splitHash(value).map((item, index) => {
        if (prefix === "Do") {
            const match = item.match(
                /^\s*do\s*:\s*(.*?)\s*\|\s*don['’]t\s*:\s*(.*?)\s*$/i,
            );
            return {
                id: `${index}-${item}`,
                title: `Pair ${index + 1}`,
                left: match?.[1]?.trim() ?? item,
                right: match?.[2]?.trim() ?? "",
            };
        }

        const splitIndex = item.indexOf(" - ");
        return {
            id: `${index}-${item}`,
            title: `Phrase ${index + 1}`,
            left:
                splitIndex >= 0 ? item.slice(0, splitIndex).trim() : item,
            right:
                splitIndex >= 0 ? item.slice(splitIndex + 3).trim() : "",
        };
    });
}

function parseMirroredExplanation(value: string) {
    const stripPrefix = (part: string) => {
        const colonIndex = part.indexOf(":");
        return (colonIndex >= 0 ? part.slice(colonIndex + 1) : part).trim();
    };

    const parts = splitPipe(value);
    if (parts.length >= 2) {
        return {
            left: stripPrefix(parts[0]),
            right: stripPrefix(parts.slice(1).join(" | ")),
        };
    }

    return {
        left: stripPrefix(value),
        right: "",
    };
}

function splitWrapupTakeaways(value: string) {
    const pipeParts = splitPipe(value);
    if (pipeParts.length > 1) {
        return pipeParts;
    }
    return splitDash(value);
}

function splitProcessPitfalls(value: string): string[] {
    return value
        .trim()
        .replace(/^["“]|["”]$/g, "")
        .split(
            /\s*\|\s*|\s+-\s+(?=\d+\.)|\.\s+(?=\d+\.)|\.\s+(?=pitfalls?\s*:)/i,
        )
        .map((part) =>
            part
                .replace(/\.\s*$/, "")
                .trim(),
        )
        .filter(Boolean);
}

function findLesson(roadmap: RoadmapResponse | null, lessonId: number): LessonLookup | null {
    if (!roadmap) {
        return null;
    }

    for (const topic of roadmap.topics) {
        const lesson = topic.lessons.find((item) => item.id === lessonId);
        if (lesson) {
            return {
                track: roadmap.track,
                topic,
                lesson,
            };
        }
    }

    return null;
}

function SectionButton({
    meta,
    isActive,
    onClick,
}: {
    meta: SectionMeta;
    isActive: boolean;
    onClick: () => void;
}) {
    const Icon = meta.icon;

    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "w-full rounded-2xl border px-4 py-3 text-left transition-all",
                isActive
                    ? "border-blue-500 bg-blue-50 text-blue-900 shadow-sm dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:bg-slate-800/80",
            ].join(" ")}
        >
            <div className="flex items-start gap-3">
                <div
                    className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                        isActive
                            ? "border-blue-200 bg-white text-blue-600 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300"
                            : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
                    ].join(" ")}
                >
                    <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        {meta.eyebrow}
                    </p>
                    <p className="mt-1 font-semibold">{meta.label}</p>
                </div>
            </div>
        </button>
    );
}

function PanelShell({
    eyebrow,
    title,
    note,
    children,
}: {
    eyebrow: string;
    title: string;
    note?: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <header className="border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-800/60">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
                    {eyebrow}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                    {title}
                </h2>
                {note ? (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        {note}
                    </p>
                ) : null}
            </header>
            <div className="space-y-6 p-6">{children}</div>
        </section>
    );
}

function EmptyPanel({
    title,
    message,
}: {
    title: string;
    message: string;
}) {
    return (
        <PanelShell eyebrow="Unavailable" title={title}>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400">
                {message}
            </div>
        </PanelShell>
    );
}

function VocabularySection({ section }: { section: ParsedTheorySection }) {
    const items = splitHash(section.primary).map((entry, index) => {
        const parts = entry.split("|").map((part) => part.trim());
        const term = parts[0] ?? "";
        const ipa = parts[1] ?? "";
        const partOfSpeech = parts[2] ?? "";
        const meaning = parts[3] ?? "";
        const explanation = parts.length >= 6 ? parts[4] : "";
        const example = parts.length >= 6 ? parts[5] : (parts[4] ?? "");
        const pronunciationGuide = parts.length >= 7 ? parts[6] : "";

        return {
            id: `${index}-${term}`,
            term,
            ipa,
            partOfSpeech,
            meaning,
            explanation,
            example,
            pronunciationGuide,
        };
    });

    // Parse secondary pronunciation tips and spoken drills
    const secondaryParts = splitPipe(section.secondary);
    const pronunciationGuideText = secondaryParts
        .find((p) => /^Pronunciation\s*Guide\s*:/i.test(p))
        ?.replace(/^Pronunciation\s*Guide\s*:\s*/i, "");
    const drillSentences = secondaryParts
        .filter((p) => !/^Pronunciation\s*Guide\s*:/i.test(p))
        .map((p) => p.replace(/^Drills\s*:\s*/i, "").trim())
        .filter(Boolean);

    return (
        <PanelShell eyebrow="Section 2" title={section.label} note={section.note}>
            <div className="grid gap-5 md:grid-cols-2">
                {items.map((item) => (
                    <article
                        key={item.id}
                        className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <h3 className="text-xl font-bold text-slate-950 dark:text-white">
                                        {item.term}
                                    </h3>
                                    <AudioSpeakButton text={item.term} />
                                </div>
                                <Badge variant="outline">{item.partOfSpeech}</Badge>
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
                                    {item.ipa}
                                </p>
                                {item.pronunciationGuide && (
                                    <Badge variant="secondary" className="text-xs">
                                        {item.pronunciationGuide}
                                    </Badge>
                                )}
                            </div>

                            <div className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 dark:bg-slate-800/60 dark:text-slate-200">
                                {item.meaning}
                            </div>

                            {item.explanation && (
                                <div className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        Nuance & Context:{" "}
                                    </span>
                                    {item.explanation}
                                </div>
                            )}
                        </div>

                        {item.example && (
                            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 text-xs leading-5 text-slate-700 dark:border-blue-950 dark:bg-blue-950/20 dark:text-slate-300">
                                <div className="mb-1.5 flex items-center justify-between">
                                    <span className="font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                                        Workplace Example
                                    </span>
                                    <AudioSpeakButton
                                        text={item.example}
                                        label="Read sentence"
                                    />
                                </div>
                                <p className="italic">"{item.example}"</p>
                            </div>
                        )}
                    </article>
                ))}
            </div>

            {/* Pronunciation Guide & Speaking Drills */}
            {section.secondary && (
                <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/60 p-6 dark:border-blue-900 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                            <Volume2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                                Speaking & Pronunciation Drills
                            </p>
                            <h4 className="text-base font-bold text-slate-950 dark:text-white">
                                Pronunciation Tips & Spoken Repetition (Shadowing)
                            </h4>
                        </div>
                    </div>

                    {pronunciationGuideText && (
                        <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm dark:bg-slate-800/80 dark:text-slate-200">
                            <span className="font-semibold text-blue-700 dark:text-blue-300">
                                Phonetic Guidance:{" "}
                            </span>
                            {pronunciationGuideText}
                        </div>
                    )}

                    {drillSentences.length > 0 && (
                        <div className="mt-4 space-y-2.5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Read aloud practice:
                            </p>
                            {drillSentences.map((drill, idx) => (
                                <div
                                    key={idx}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-sm dark:border-slate-800 dark:bg-slate-950"
                                >
                                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                                        {drill}
                                    </span>
                                    <AudioSpeakButton
                                        text={drill.replace(/^\d+\.\s*/, "")}
                                        label="Listen & Repeat"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </PanelShell>
    );
}

function PhrasesSection({ section }: { section: ParsedTheorySection }) {
    const patterns = splitHash(section.primary).map((entry, index) => {
        const parts = entry.split("|").map((part) => part.trim());
        const frame = parts[0] ?? "";
        const meaning = parts.length >= 4 ? parts[1] : "";
        const usage = parts.length >= 4 ? parts[2] : (parts[1] ?? "");
        const example = parts.length >= 4 ? parts[3] : (parts[2] ?? "");

        return {
            id: `${index}-${frame}`,
            frame,
            meaning,
            usage,
            example,
        };
    });

    const scenarios = splitPipe(section.secondary);

    return (
        <PanelShell eyebrow="Section 3" title={section.label} note={section.note}>
            <div className="space-y-4">
                {patterns.map((pattern) => (
                    <article
                        key={pattern.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <NotebookPen className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                                <h3 className="font-bold text-slate-950 dark:text-white">
                                    {pattern.frame}
                                </h3>
                                <AudioSpeakButton text={pattern.frame} />
                            </div>
                            {pattern.meaning && (
                                <Badge variant="secondary" className="text-xs">
                                    {pattern.meaning}
                                </Badge>
                            )}
                        </div>

                        {pattern.usage && (
                            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    When to use:{" "}
                                </span>
                                {pattern.usage}
                            </p>
                        )}

                        {pattern.example && (
                            <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                                <div className="mb-1 flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase text-slate-400">
                                        Workplace Example
                                    </span>
                                    <AudioSpeakButton
                                        text={pattern.example}
                                        label="Read example"
                                    />
                                </div>
                                <p className="italic">"{pattern.example}"</p>
                            </div>
                        )}
                    </article>
                ))}
            </div>

            {/* Mini-Scenario Challenges */}
            {scenarios.length > 0 && (
                <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/50 p-6 dark:border-blue-900 dark:bg-blue-950/20">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300 mb-3">
                        Mini-Scenario Challenges
                    </p>
                    <div className="space-y-3">
                        {scenarios.map((scenario, index) => (
                            <div
                                key={index}
                                className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                            >
                                {scenario}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </PanelShell>
    );
}

function ReadingPracticeSection({
    section,
    qas,
}: {
    section: ParsedTheorySection;
    qas: Array<{ question: string; answer: string }>;
}) {
    const [draftAnswers, setDraftAnswers] = useState<Record<number, string>>({});
    const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});

    return (
        <PanelShell eyebrow="Section 4" title={section.label} note={section.note}>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    <span>Workplace Technical Document</span>
                </div>
                <p className="text-sm leading-8 text-slate-800 dark:text-slate-100 whitespace-pre-line">
                    {section.primary}
                </p>
            </article>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-slate-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-slate-200">
                <p className="font-semibold text-slate-950 dark:text-white">
                    Reading comprehension practice
                </p>
                <p className="mt-1 leading-6">
                    Write your own answers first, then click{" "}
                    <span className="font-semibold">Show answer</span> to compare.
                    This practice is for self-study and does not affect your quiz score.
                </p>
            </div>

            <div className="space-y-4">
                {qas.map((qa, index) => {
                    const isRevealed = Boolean(revealedAnswers[index]);
                    const draft = draftAnswers[index] ?? "";

                    return (
                        <article
                            key={`${index}-${qa.question}`}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                            <p className="font-medium text-slate-950 dark:text-white">
                                {qa.question}
                            </p>

                            <textarea
                                value={draft}
                                onChange={(event) =>
                                    setDraftAnswers((prev) => ({
                                        ...prev,
                                        [index]: event.target.value,
                                    }))
                                }
                                placeholder="Write your answer here..."
                                className="mt-4 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition-colors focus:border-blue-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-700 dark:focus:bg-slate-900"
                            />

                            <div className="mt-4 flex flex-wrap gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setRevealedAnswers((prev) => ({
                                            ...prev,
                                            [index]: !prev[index],
                                        }))
                                    }
                                >
                                    {isRevealed ? "Hide answer" : "Show answer"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setDraftAnswers((prev) => ({
                                            ...prev,
                                            [index]: "",
                                        }))
                                    }
                                >
                                    Clear
                                </Button>
                            </div>

                            {isRevealed ? (
                                <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-slate-700 dark:bg-emerald-950/30 dark:text-slate-200 animate-in fade-in">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                                        Reference answer
                                    </p>
                                    <p className="mt-1">{qa.answer}</p>
                                </div>
                            ) : null}
                        </article>
                    );
                })}
            </div>
        </PanelShell>
    );
}

function DialogueSection({ section }: { section: ParsedTheorySection }) {
    let contextText = "";
    let dialogueContent = section.primary;

    if (dialogueContent.includes(" || ")) {
        const [left, right] = dialogueContent.split(" || ");
        if (/^Context\s*:/i.test(left)) {
            contextText = left.replace(/^Context\s*:\s*/i, "").trim();
            dialogueContent = right.replace(/^Dialogue\s*:\s*/i, "").trim();
        }
    }

    const lines = parseDialogueLines(dialogueContent);

    let partA = section.secondary;
    let partB = "";
    if (section.secondary.includes(" || ")) {
        const [a, b] = section.secondary.split(" || ");
        partA = a;
        partB = b;
    }

    const highlights = parseDialogueHighlights(partA);
    const practiceTasks = partB
        ? splitPipe(partB.replace(/^Practice\s*Tasks\s*:\s*/i, ""))
        : [];

    const [userReplies, setUserReplies] = useState<Record<number, string>>({});

    return (
        <PanelShell eyebrow="Section 5" title={section.label} note={section.note}>
            {/* Scenario Setting / Context Banner */}
            {contextText && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/80 px-5 py-4 text-sm text-slate-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                        Conversation Setting & Objective
                    </p>
                    <p className="mt-1.5 leading-6 text-slate-800 dark:text-slate-100 font-medium">
                        {contextText}
                    </p>
                </div>
            )}

            {/* Dialogue Turns */}
            <div className="space-y-4">
                {lines.map((line, index) => (
                    <div
                        key={line.id}
                        className={[
                            "max-w-3xl rounded-3xl p-5 text-sm leading-7 shadow-sm",
                            index % 2 === 0
                                ? "mr-auto border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
                                : "ml-auto bg-blue-600 text-white",
                        ].join(" ")}
                    >
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                            <span className="text-xs font-bold uppercase tracking-[0.18em] opacity-80">
                                {line.speaker}
                            </span>
                            <AudioSpeakButton
                                text={line.text}
                                className={
                                    index % 2 === 0
                                        ? "inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-200"
                                        : "inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white hover:bg-white/30"
                                }
                            />
                        </div>
                        <p>{line.text}</p>
                    </div>
                ))}
            </div>

            {/* Key Strategic Phrases */}
            {highlights.length > 0 && (
                <div className="space-y-3 pt-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Key Strategic Phrases Used:
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                        {highlights.map((highlight) => (
                            <article
                                key={highlight.id}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-semibold text-slate-950 dark:text-white">
                                        {highlight.left}
                                    </p>
                                    <AudioSpeakButton text={highlight.left} />
                                </div>
                                <p className="mt-2.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                    {highlight.right}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            )}

            {/* Interactive Roleplay Practice Tasks */}
            {practiceTasks.length > 0 && (
                <div className="rounded-3xl border border-indigo-200 bg-indigo-50/40 p-6 dark:border-indigo-950 dark:bg-slate-900/60">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                            <MessageSquareText className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                                Interactive Roleplay Practice
                            </p>
                            <h4 className="text-base font-bold text-slate-950 dark:text-white">
                                Practice Replying to Meeting Scenarios
                            </h4>
                        </div>
                    </div>

                    <div className="mt-5 space-y-4">
                        {practiceTasks.map((task, idx) => (
                            <div
                                key={idx}
                                className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 shadow-sm"
                            >
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {task}
                                </p>
                                <textarea
                                    value={userReplies[idx] ?? ""}
                                    onChange={(e) =>
                                        setUserReplies((prev) => ({
                                            ...prev,
                                            [idx]: e.target.value,
                                        }))
                                    }
                                    placeholder="Type your response here and practice speaking it out loud..."
                                    className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                />
                                {userReplies[idx] && (
                                    <div className="mt-2.5 flex justify-end">
                                        <AudioSpeakButton
                                            text={userReplies[idx]}
                                            label="Listen to my response"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </PanelShell>
    );
}

function ListeningPracticeSection({
    section,
}: {
    section: ParsedTheorySection;
}) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const [draftAnswers, setDraftAnswers] = useState<Record<number, string>>({});
    const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});

    const rawScript = section.primary;
    const scriptText = rawScript
        .replace(/^Audio\s*Script\s*:\s*/i, "")
        .replace(/^\[.*?\]\s*:\s*/i, "")
        .replace(/^["']|["']$/g, "")
        .trim();

    const questions = parseReadingQuestions(section.secondary);

    const handlePlayAll = () => {
        if (isPlaying) {
            stopSpeech();
            setIsPlaying(false);
            return;
        }
        setIsPlaying(true);
        speakText(scriptText, () => setIsPlaying(false));
    };

    return (
        <PanelShell eyebrow="Section 6" title={section.label} note={section.note}>
            {/* Audio Player Card */}
            <div className="rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 dark:border-blue-900 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                            <Headphones className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                                Workplace Audio Track
                            </p>
                            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                                Authentic Spoken Workplace Monologue
                            </h3>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            onClick={handlePlayAll}
                            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                            {isPlaying ? (
                                <>
                                    <Square className="mr-2 h-4 w-4" />
                                    Stop audio
                                </>
                            ) : (
                                <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Play audio track
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowTranscript(!showTranscript)}
                            className="rounded-full"
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            {showTranscript ? "Hide transcript" : "View transcript"}
                        </Button>
                    </div>
                </div>

                {/* Audio Script (collapsible) */}
                {showTranscript && (
                    <article className="mt-5 rounded-2xl border border-blue-200 bg-white p-5 shadow-inner dark:border-blue-900 dark:bg-slate-950 animate-in fade-in slide-in-from-top-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-2">
                            Audio Script / Transcript
                        </p>
                        <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
                            {rawScript}
                        </p>
                    </article>
                )}
            </div>

            {/* Comprehension Questions */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 px-1">
                    <ListChecks className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    <h4 className="font-semibold text-slate-950 dark:text-white">
                        Listening Comprehension Questions
                    </h4>
                </div>

                {questions.map((qa, index) => {
                    const isRevealed = Boolean(revealedAnswers[index]);
                    const draft = draftAnswers[index] ?? "";

                    return (
                        <article
                            key={`${index}-${qa.question}`}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                            <p className="font-medium text-slate-950 dark:text-white">
                                {qa.question}
                            </p>

                            <textarea
                                value={draft}
                                onChange={(e) =>
                                    setDraftAnswers((prev) => ({
                                        ...prev,
                                        [index]: e.target.value,
                                    }))
                                }
                                placeholder="Write what you heard or answer here..."
                                className="mt-4 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition-colors focus:border-blue-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-700 dark:focus:bg-slate-900"
                            />

                            <div className="mt-4 flex flex-wrap gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setRevealedAnswers((prev) => ({
                                            ...prev,
                                            [index]: !prev[index],
                                        }))
                                    }
                                >
                                    {isRevealed ? "Hide answer" : "Show answer"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setDraftAnswers((prev) => ({
                                            ...prev,
                                            [index]: "",
                                        }))
                                    }
                                >
                                    Clear
                                </Button>
                            </div>

                            {isRevealed && (
                                <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-slate-700 dark:bg-emerald-950/30 dark:text-slate-200 animate-in fade-in">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                                        Reference answer
                                    </p>
                                    <p className="mt-1">{qa.answer}</p>
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>
        </PanelShell>
    );
}

function WrapupSection({ section }: { section: ParsedTheorySection }) {
    const takeaways = splitWrapupTakeaways(section.primary);
    const [actionDraft, setActionDraft] = useState("");
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        if (actionDraft) {
            navigator.clipboard.writeText(actionDraft);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const wordCount = actionDraft.trim()
        ? actionDraft.trim().split(/\s+/).length
        : 0;

    return (
        <PanelShell eyebrow="Section 7" title={section.label} note={section.note}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-5">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2.5">
                            <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                                Core Linguistic Takeaways
                            </h3>
                        </div>
                        <div className="mt-4 space-y-3">
                            {takeaways.map((takeaway, index) => (
                                <div
                                    key={`${index}-${takeaway}`}
                                    className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
                                >
                                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                        {index + 1}
                                    </div>
                                    <span>{takeaway}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Interactive Action Challenge Task */}
                    <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-indigo-50/60 p-6 dark:border-blue-900 dark:bg-slate-900">
                        <div className="flex items-center gap-2.5">
                            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                                5-Minute Output Challenge
                            </h3>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                            {section.secondary}
                        </p>

                        <div className="mt-4">
                            <textarea
                                value={actionDraft}
                                onChange={(e) => setActionDraft(e.target.value)}
                                placeholder="Draft your email, message, or speech notes applying lesson concepts here..."
                                className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            />
                            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                <span>{wordCount} words</span>
                                <div className="flex items-center gap-2">
                                    {actionDraft && (
                                        <AudioSpeakButton
                                            text={actionDraft}
                                            label="Listen to my draft"
                                        />
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopy}
                                        disabled={!actionDraft}
                                        className="h-7 text-xs"
                                    >
                                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                                        {isCopied ? "Copied!" : "Copy text"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                            Ready for Quiz
                        </p>
                        <h4 className="mt-1 text-base font-bold text-slate-950 dark:text-white">
                            Self-Check Checklist
                        </h4>
                        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {section.note}
                        </p>
                    </article>
                </div>
            </div>
        </PanelShell>
    );
}

function renderTheorySection(section: ParsedTheorySection) {
    switch (section.key) {
        case "scenario": {
            const [english, ...viParts] = splitPipe(section.primary);
            const decisions = splitPipe(section.secondary);
            return (
                <PanelShell eyebrow="Section 1" title={section.label} note={section.note}>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl bg-slate-950 px-5 py-5 text-slate-50 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                                English scenario
                            </p>
                            <p className="mt-3 text-sm leading-7">{english}</p>
                        </div>
                        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-5 dark:border-blue-900 dark:bg-blue-950/30 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                                Vietnamese support
                            </p>
                            <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
                                {viParts.join(" | ")}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">
                            Decision points to resolve
                        </p>
                        <div className="mt-4 grid gap-3">
                            {decisions.map((decision, index) => (
                                <div
                                    key={`${index}-${decision}`}
                                    className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200"
                                >
                                    {decision}
                                </div>
                            ))}
                        </div>
                    </div>
                </PanelShell>
            );
        }

        case "vocab": {
            return <VocabularySection section={section} />;
        }

        case "phrases": {
            return <PhrasesSection section={section} />;
        }

        case "reading": {
            const qas = parseReadingQuestions(section.secondary);
            return <ReadingPracticeSection section={section} qas={qas} />;
        }

        case "dialogue": {
            return <DialogueSection section={section} />;
        }

        case "listening": {
            return <ListeningPracticeSection section={section} />;
        }

        case "process": {
            // Legacy fallback
            const steps = splitPipe(section.primary);
            const pitfalls = splitProcessPitfalls(section.secondary);
            return (
                <PanelShell eyebrow="Section 6" title={section.label} note={section.note}>
                    <div className="space-y-4">
                        {steps.map((step, index) => (
                            <article
                                key={`${index}-${step}`}
                                className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 lg:grid-cols-[auto_minmax(0,1fr)]"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white">
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-950 dark:text-white">
                                        {step}
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                        {pitfalls[index] ?? ""}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                </PanelShell>
            );
        }

        case "dos_donts": {
            // Legacy fallback
            const pairs = parseIndexedExplanation(section.primary, "Do");
            const explanations = splitHash(section.secondary);
            return (
                <PanelShell eyebrow="Section 7" title={section.label} note={section.note}>
                    <div className="space-y-4">
                        {pairs.map((pair, index) => (
                            <DosDontsArticle
                                key={pair.id}
                                pair={pair}
                                explanationString={explanations[index] ?? ""}
                            />
                        ))}
                    </div>
                </PanelShell>
            );
        }

        case "wrapup": {
            return <WrapupSection section={section} />;
        }
    }
}

function EmbeddedLessonQuiz({ quiz }: { quiz: ParsedQuiz | null }) {
    const questions = useMemo(
        () => shuffleQuestions(buildEmbeddedQuizQuestions(quiz)),
        [quiz],
    );
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);

    useEffect(() => {
        setCurrentQuestionIndex(0);
        setAnswers({});
        setSubmitted(false);
        setShowSummary(false);
        setShowIncompleteWarning(false);
    }, [quiz]);

    if (!quiz || questions.length === 0) {
        return (
            <EmptyPanel
                title="Quiz"
                message="This lesson does not have valid C-2 quiz content yet."
            />
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestionIndex];
    const totalQuestions = questions.length;
    const answeredCount = Object.values(answers).filter((value) => hasAnswer(value)).length;
    const unansweredCount = totalQuestions - answeredCount;
    const correctCount = questions.reduce(
        (count, question, index) =>
            count + (submitted && isEmbeddedAnswerCorrect(question, answers[index]) ? 1 : 0),
        0,
    );
    const progressValue = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

    const handleRestart = () => {
        setCurrentQuestionIndex(0);
        setAnswers({});
        setSubmitted(false);
        setShowSummary(false);
        setShowIncompleteWarning(false);
    };

    const handleSubmitQuiz = () => {
        if (unansweredCount > 0) {
            setShowIncompleteWarning(true);
            return;
        }

        setSubmitted(true);
        setShowIncompleteWarning(false);
    };

    const handleConfirmSubmitQuiz = () => {
        setSubmitted(true);
        setShowIncompleteWarning(false);
    };

    const questionNavigator = (
        <div className="flex gap-2 overflow-x-auto pb-5 pt-1 px-0.5">
            {questions.map((question, index) => {
                const isActive = index === currentQuestionIndex;
                const isAnswered = hasAnswer(answers[index]);
                const isCorrect = submitted && isEmbeddedAnswerCorrect(question, answers[index]);

                return (
                    <button
                        key={question.id}
                        type="button"
                        onClick={() => {
                            setCurrentQuestionIndex(index);
                            setShowSummary(false);
                        }}
                        className={[
                            "flex h-10 w-10 min-w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                            isActive
                                ? "border-blue-600 bg-blue-600 text-white"
                                : submitted && isCorrect
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                    : submitted
                                        ? "border-rose-300 bg-rose-50 text-rose-700"
                                        : isAnswered
                                            ? "border-amber-300 bg-amber-50 text-amber-700"
                                            : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                        ].join(" ")}
                    >
                        {index + 1}
                    </button>
                );
            })}
        </div>
    );

    return (
        <PanelShell
            eyebrow="Section 8"
            title="Quiz"
            note="One question at a time, embedded directly in the lesson page."
        >
            <div className="space-y-6">
                <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/60 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                                <ClipboardList className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                    Embedded quiz
                                </p>
                                <p className="font-semibold text-slate-950 dark:text-white">
                                    Question {currentQuestionIndex + 1} of {totalQuestions}
                                </p>
                            </div>
                        </div>
                        <Progress value={progressValue} indicatorClassName="bg-blue-600" />
                    </div>

                    <div className="grid gap-2 text-sm sm:grid-cols-3 lg:min-w-[320px]">
                        <div className="rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Answered</p>
                            <p className="mt-1 font-semibold text-slate-950 dark:text-white">{answeredCount}</p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Status</p>
                            <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                                {submitted ? "Submitted" : "In progress"}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Correct</p>
                            <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                                {submitted ? correctCount : "?"}
                            </p>
                        </div>
                    </div>
                </div>

                {questionNavigator}

                {showSummary ? (
                    <section className="space-y-5">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                        Quiz complete
                                    </p>
                                    <h3 className="text-2xl font-bold text-slate-950 dark:text-white">
                                        {correctCount} / {totalQuestions} correct
                                    </h3>
                                </div>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                Review any question from the navigator above, or restart the quiz
                                to take the embedded lesson check again.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <Button onClick={handleRestart}>Restart quiz</Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowSummary(false);
                                        setCurrentQuestionIndex(0);
                                    }}
                                >
                                    Review from question 1
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {questions.map((question, index) => {
                                const isCorrect = isEmbeddedAnswerCorrect(question, answers[index]);
                                return (
                                    <button
                                        key={`summary-${question.id}`}
                                        type="button"
                                        onClick={() => {
                                            setCurrentQuestionIndex(index);
                                            setShowSummary(false);
                                        }}
                                        className={[
                                            "rounded-2xl border px-4 py-4 text-left transition-colors",
                                            isCorrect
                                                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                                : "border-rose-300 bg-rose-50 text-rose-900",
                                        ].join(" ")}
                                    >
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
                                            Question {index + 1}
                                        </p>
                                        <p className="mt-2 font-semibold">
                                            {question.type.replace("_", " ")}
                                        </p>
                                        <p className="mt-2 text-sm opacity-80">
                                            {isCorrect ? "Correct" : "Needs review"}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                ) : (
                    <div className="space-y-5">
                        {currentQuestion.type === "fill_blank" ? (
                            <FillBlankQuestion
                                key={currentQuestion.id}
                                data={currentQuestion.data as FillBlankQuestionData}
                                questionNumber={currentQuestionIndex + 1}
                                totalQuestions={totalQuestions}
                                onAnswer={(answer) =>
                                    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: answer }))
                                }
                                isSubmitted={submitted}
                                userAnswer={currentAnswer}
                            />
                        ) : currentQuestion.type === "multi_select" ? (
                            <MultiSelectQuestion
                                key={currentQuestion.id}
                                data={currentQuestion.data as MultiSelectQuestionData}
                                questionNumber={currentQuestionIndex + 1}
                                totalQuestions={totalQuestions}
                                userAnswer={currentAnswer ?? null}
                                onAnswerChange={(answer) =>
                                    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: answer }))
                                }
                                isSubmitted={submitted}
                                isCorrect={submitted ? isEmbeddedAnswerCorrect(currentQuestion, currentAnswer) : undefined}
                                explanation={currentQuestion.data[3]}
                            />
                        ) : (
                            <OrderingQuestion
                                key={currentQuestion.id}
                                data={currentQuestion.data as OrderingQuestionData}
                                questionNumber={currentQuestionIndex + 1}
                                totalQuestions={totalQuestions}
                                userAnswer={currentAnswer ?? null}
                                onAnswerChange={(answer) =>
                                    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: answer }))
                                }
                                isSubmitted={submitted}
                                isCorrect={submitted ? isEmbeddedAnswerCorrect(currentQuestion, currentAnswer) : undefined}
                                explanation={currentQuestion.data[3]}
                            />
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                {submitted
                                    ? isEmbeddedAnswerCorrect(currentQuestion, currentAnswer)
                                        ? "Correct. You can move on to the next question."
                                        : "Reviewed. You can revise the explanation and continue."
                                    : "Move through the quiz with Next. Answers are revealed only after you submit on the last question."}
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                                    }
                                    disabled={currentQuestionIndex === 0}
                                >
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    Previous
                                </Button>

                                {submitted && isLastQuestion ? (
                                    <Button onClick={() => setShowSummary(true)}>
                                        View summary
                                        <Check className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : !submitted && isLastQuestion ? (
                                    <Button onClick={handleSubmitQuiz}>
                                        Submit quiz
                                        <Check className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() =>
                                            setCurrentQuestionIndex((prev) =>
                                                Math.min(totalQuestions - 1, prev + 1),
                                            )
                                        }
                                    >
                                        Next
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <AlertDialog
                    open={showIncompleteWarning}
                    onOpenChange={setShowIncompleteWarning}
                >
                    <AlertDialogContent className="rounded-3xl border-slate-200 p-0 shadow-2xl dark:border-slate-800">
                        <div className="p-6 sm:p-7">
                            <AlertDialogHeader className="text-left">
                                <AlertDialogTitle className="text-xl font-bold text-slate-950 dark:text-white">
                                    Submit quiz with unanswered questions?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="pt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                    You still have {unansweredCount} unanswered question
                                    {unansweredCount === 1 ? "" : "s"}. If you submit now,
                                    those questions will be graded as unanswered and the
                                    answers will be revealed immediately.
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                                Review the remaining questions now, or confirm to submit the
                                quiz as-is.
                            </div>

                            <AlertDialogFooter className="mt-6">
                                <AlertDialogCancel>Go back</AlertDialogCancel>
                                <AlertDialogAction onClick={handleConfirmSubmitQuiz}>
                                    Submit anyway
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </PanelShell>
    );
}

export function LessonPage({ lessonId }: { lessonId: number }) {
    const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<SidebarSectionKey>("scenario");

    useEffect(() => {
        setActiveSection("scenario");
    }, [lessonId]);

    useEffect(() => {
        let isMounted = true;

        const loadRoadmap = async () => {
            setLoading(true);
            setError(null);

            try {
                const data = await fetchRoadmap();
                if (isMounted) {
                    setRoadmap(data);
                }
            } catch (loadError) {
                if (isMounted) {
                    setError(
                        loadError instanceof Error
                            ? loadError.message
                            : "Failed to load lesson.",
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void loadRoadmap();

        return () => {
            isMounted = false;
        };
    }, [lessonId]);

    const lessonLookup = useMemo(
        () => (Number.isNaN(lessonId) ? null : findLesson(roadmap, lessonId)),
        [lessonId, roadmap],
    );
    const theorySections = useMemo(
        () => normalizeTheoryContent(lessonLookup?.lesson.theory_content ?? null),
        [lessonLookup],
    );
    const quiz = useMemo(
        () => normalizeQuizContent(lessonLookup?.lesson.quiz_content ?? null),
        [lessonLookup],
    );
    const activeTheorySection = useMemo(
        () =>
            theorySections?.find((section) => section.key === activeSection) ?? null,
        [activeSection, theorySections],
    );

    if (loading) {
        return <LessonSkeleton />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
                <MainNavigationMenu />
                <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-lg font-semibold text-slate-950 dark:text-white">
                            Cannot load this lesson
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            {error}
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <Button onClick={() => window.location.reload()}>Retry</Button>
                            <Button asChild variant="outline">
                                <Link to="/lessons/learning-path">Back to roadmap</Link>
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!lessonLookup) {
        return (
            <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
                <MainNavigationMenu />
                <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-lg font-semibold text-slate-950 dark:text-white">
                            Lesson not found
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            This lesson is not part of your current roadmap.
                        </p>
                        <div className="mt-6">
                            <Button asChild variant="outline">
                                <Link to="/lessons/learning-path">Back to roadmap</Link>
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const { lesson, topic, track } = lessonLookup;

    if (!lesson.is_generated) {
        return (
            <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
                <MainNavigationMenu />
                <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-lg font-semibold text-slate-950 dark:text-white">
                            Lesson content is not ready yet
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Theory and quiz content have not been generated for this lesson yet.
                        </p>
                        <div className="mt-6">
                            <Button asChild variant="outline">
                                <Link to="/lessons/learning-path">Back to roadmap</Link>
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_22%,#f8fafc_100%)] text-slate-950 dark:bg-slate-950 dark:text-white">
            <MainNavigationMenu />

            <main className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 xl:px-8">
                <header className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center gap-3">
                        <Button asChild variant="outline" size="sm">
                            <Link to="/lessons/learning-path">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to roadmap
                            </Link>
                        </Button>
                        <Badge variant="secondary" className="capitalize">
                            {track} track
                        </Badge>
                        <Badge variant="outline">{formatLabel(topic.primary_skill)}</Badge>
                        <Badge variant="outline">{formatLabel(lesson.difficulty_tier)}</Badge>
                    </div>

                    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-end">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                                Topic {topic.sort_order} · {topic.name}
                            </p>
                            <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                                {lesson.title}
                            </h1>
                            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                                This page renders the stored C-1 theory and C-2 quiz content for
                                your selected lesson directly from the database-backed roadmap.
                            </p>
                        </div>

                        <div className="grid gap-3 rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/60">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                        Ready now
                                    </p>
                                    <p className="font-semibold text-slate-950 dark:text-white">
                                        7 theory sections + quiz
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                                Use the left navigation to move between the seven theory sections
                                and the final quiz tab.
                            </p>
                        </div>
                    </div>
                </header>

                <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="xl:sticky xl:top-24 xl:self-start">
                        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-4 px-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                    Lesson map
                                </p>
                                <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                                    8 sections
                                </p>
                            </div>

                            <div className="flex gap-3 overflow-x-auto pb-2 xl:flex-col xl:overflow-visible xl:pb-0">
                                {SECTION_META.map((meta) => (
                                    <div key={meta.key} className="min-w-[220px] xl:min-w-0">
                                        <SectionButton
                                            meta={meta}
                                            isActive={meta.key === activeSection}
                                            onClick={() => setActiveSection(meta.key)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>

                    <div className="min-w-0">
                        {activeSection === "quiz" ? (
                            <EmbeddedLessonQuiz quiz={quiz} />
                        ) : activeTheorySection ? (
                            renderTheorySection(activeTheorySection)
                        ) : (
                            <EmptyPanel
                                title="Section unavailable"
                                message="This section is missing or malformed in the stored lesson payload."
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}