import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type WheelEvent as ReactWheelEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
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
    Heart,
    Languages,
    ListChecks,
    MessageSquareText,
    NotebookPen,
    ScrollText,
    Sparkles,
    Target,
    Volume2,
    Mic,
    MicOff,
    type LucideIcon,
} from "lucide-react";

import { MainNavigationMenu } from "@/common/component/MainNavigationMenu";
import { useAuth } from "@/common/context/AuthContext";
import { fetchCurrentUserProfile } from "@/feature/auth/api/authAPI";
import type { UserProfileResponse } from "@/feature/auth/type/Auth";
import {
    fetchRoadmap,
    fetchLessonQuizState,
    kickoffRoadmapLessonGeneration,
    submitLessonQuiz,
    evaluateAnswer,
    type LessonQuizSubmitResponse,
    type LessonQuizStateResponse,
    type RoadmapLesson,
    type RoadmapResponse,
    type RoadmapTopic,
} from "@/feature/learning-path/api/roadmapApi";
import {
    deleteFlashcard,
    fetchFlashcards,
    saveFlashcard,
} from "@/feature/lesson-workspace/api/flashcardApi";
import { useRadar } from "@/feature/radar";
import { DailyStudyGoalDialog } from "@/feature/user-profile/component/DailyStudyGoalDialog";
import { getTrackedStudyMinutesByDay, recordStudyTime } from "@/feature/user-profile/utils/StudyActivity";
import {
    getStudyMinutesForDate,
    getTodayDateKey,
    readStudyGoalDecision,
    writeStudyGoalDecision,
    type StudyGoalDecision,
} from "@/feature/user-profile/utils/dailyStudyGoal";
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
import { ListeningAudioPlayer } from "../component/ListeningAudioPlayer";
import { prepareTTSPlaybackUrl } from "@/feature/audio/audioApi";

let activeGlobalAudio: HTMLAudioElement | null = null;
let activeSpeechRequestId = 0;

type BrowserHistoryState = Record<string, unknown>;
type LessonQuizMode = "intro" | "question" | "summary" | "review";
type LessonHistoryView = {
    lessonId: number;
    section: SidebarSectionKey;
    quizMode?: LessonQuizMode;
    questionIndex?: number | null;
};

function readBrowserHistoryState(): BrowserHistoryState {
    return window.history.state && typeof window.history.state === "object"
        ? window.history.state as BrowserHistoryState
        : {};
}

function stripLessonQuizGuardState(state: BrowserHistoryState): BrowserHistoryState {
    const nextState = { ...state };
    delete nextState.lessonQuizGuard;
    return nextState;
}

function stripEmbeddedLessonQuizViewState(state: BrowserHistoryState): BrowserHistoryState {
    const nextState = { ...state };
    delete nextState.embeddedLessonQuizView;
    return nextState;
}

function stripLegacyLessonHistoryState(state: BrowserHistoryState): BrowserHistoryState {
    return stripEmbeddedLessonQuizViewState(stripLessonQuizGuardState(state));
}

function isSidebarSectionKey(value: unknown): value is SidebarSectionKey {
    return value === "scenario"
        || value === "vocab"
        || value === "phrases"
        || value === "reading"
        || value === "dialogue"
        || value === "listening"
        || value === "wrapup"
        || value === "process"
        || value === "dos_donts"
        || value === "quiz";
}

function isLessonQuizMode(value: unknown): value is LessonQuizMode {
    return value === "intro"
        || value === "question"
        || value === "summary"
        || value === "review";
}

function buildLessonHistoryView(
    lessonId: number,
    section: SidebarSectionKey,
    quizMode?: LessonQuizMode,
    questionIndex?: number | null,
): LessonHistoryView {
    if (section !== "quiz") {
        return {
            lessonId,
            section,
            questionIndex: null,
        };
    }

    const nextQuizMode = quizMode ?? "intro";
    return {
        lessonId,
        section,
        quizMode: nextQuizMode,
        questionIndex:
            nextQuizMode === "question" || nextQuizMode === "review"
                ? Math.max(0, Number(questionIndex ?? 0))
                : null,
    };
}

function readLessonHistoryViewFromState(state: BrowserHistoryState): LessonHistoryView | null {
    const rawView = state.lessonView;
    if (rawView && typeof rawView === "object" && !Array.isArray(rawView)) {
        const view = rawView as {
            lessonId?: unknown;
            section?: unknown;
            quizMode?: unknown;
            questionIndex?: unknown;
        };

        if (typeof view.lessonId === "number" && isSidebarSectionKey(view.section)) {
            return buildLessonHistoryView(
                view.lessonId,
                view.section,
                isLessonQuizMode(view.quizMode) ? view.quizMode : undefined,
                typeof view.questionIndex === "number" ? view.questionIndex : null,
            );
        }
    }

    const legacyView = readEmbeddedLessonQuizViewFromHistoryState(state);
    if (!legacyView || typeof legacyView.lessonId !== "number") {
        return null;
    }

    return buildLessonHistoryView(
        legacyView.lessonId,
        "quiz",
        legacyView.mode === "review" ? "review" : "summary",
        typeof legacyView.questionIndex === "number" ? legacyView.questionIndex : null,
    );
}

function areLessonHistoryViewsEqual(
    left: LessonHistoryView | null,
    right: LessonHistoryView | null,
) {
    if (left === right) {
        return true;
    }

    if (!left || !right) {
        return false;
    }

    return left.lessonId === right.lessonId
        && left.section === right.section
        && left.quizMode === right.quizMode
        && (left.questionIndex ?? null) === (right.questionIndex ?? null);
}

function readEmbeddedLessonQuizViewFromHistoryState(state: BrowserHistoryState) {
    if (!("embeddedLessonQuizView" in state)) {
        return null;
    }

    const rawView = state.embeddedLessonQuizView;
    if (!rawView || typeof rawView !== "object" || Array.isArray(rawView)) {
        return null;
    }

    const view = rawView as {
        lessonId?: number;
        mode?: "summary" | "review";
        questionIndex?: number | null;
    };

    return view;
}
function stopSpeech() {
    activeSpeechRequestId += 1;
    if (activeGlobalAudio) {
        activeGlobalAudio.pause();
        activeGlobalAudio.currentTime = 0;
        activeGlobalAudio = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
}

async function speakText(text: string, onEnd?: () => void, voiceOverride?: string) {
    const requestId = activeSpeechRequestId + 1;
    stopSpeech();
    activeSpeechRequestId = requestId;
    const defaultSavedVoice =
        (typeof window !== "undefined" &&
            localStorage.getItem("toeic_audio_voice")) ||
        "en-US-JennyNeural";
    const selectedVoice = voiceOverride || defaultSavedVoice;

    const savedRate =
        (typeof window !== "undefined" &&
            localStorage.getItem("toeic_audio_rate")) ||
        "-15";
    const rateNum = parseInt(savedRate, 10);
    const formattedRate = `${rateNum >= 0 ? "+" : ""}${rateNum}%`;

    let fallbackTriggered = false;
    const triggerFallback = () => {
        if (fallbackTriggered) return;
        fallbackTriggered = true;
        if (requestId !== activeSpeechRequestId) {
            return;
        }
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
            onEnd?.();
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = Math.max(0.65, Math.min(1.2, 1 + rateNum / 100));
        if (onEnd) {
            utterance.onend = onEnd;
            utterance.onerror = onEnd;
        }
        window.speechSynthesis.speak(utterance);
    };

    let audio: HTMLAudioElement;
    try {
        const audioUrl = await prepareTTSPlaybackUrl(text, selectedVoice, formattedRate);
        if (requestId !== activeSpeechRequestId) {
            return;
        }
        audio = new Audio(audioUrl);
        activeGlobalAudio = audio;
    } catch {
        triggerFallback();
        return;
    }

    audio.onended = () => {
        activeGlobalAudio = null;
        onEnd?.();
    };
    audio.onerror = () => {
        triggerFallback();
    };

    audio.play().catch(() => {
        triggerFallback();
    });
}

function getDialogueVoiceForSpeaker(speaker: string, index: number): string {
    const s = speaker.toLowerCase().trim();
    const femaleTerms = [
        "taylor",
        "sarah",
        "emma",
        "jenny",
        "sonia",
        "natasha",
        "clara",
        "aria",
        "anna",
        "lisa",
        "mary",
        "rachel",
        "woman",
        "female",
        "she",
        "ms",
    ];
    const maleTerms = [
        "jamie",
        "alex",
        "guy",
        "ryan",
        "william",
        "liam",
        "john",
        "david",
        "michael",
        "tom",
        "man",
        "male",
        "he",
        "mr",
    ];

    if (femaleTerms.some((term) => s.includes(term))) {
        return "en-US-JennyNeural"; // Female voice for Taylor
    }
    if (maleTerms.some((term) => s.includes(term))) {
        return "en-US-GuyNeural"; // Male voice for Jamie
    }

    // Default alternate: even index (white/left) = female, odd index (blue/right) = male
    return index % 2 === 0 ? "en-US-JennyNeural" : "en-US-GuyNeural";
}

function AudioSpeakButton({
    text,
    label,
    className,
    voice,
}: {
    text: string;
    label?: string;
    className?: string;
    voice?: string;
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
        void speakText(text, () => setIsPlaying(false), voice);
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
                className={`h-3.5 w-3.5 ${isPlaying
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
        <article className="rounded-2xl border border-slate-200 p-4 sm:p-5 dark:border-slate-800">
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
                    className="h-auto max-w-full whitespace-normal text-center text-slate-600 dark:text-slate-300"
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
    canonicalAnswer?: string;
    displayAnswer?: string;
    displayToCanonicalIndex?: number[];
    canonicalToDisplayIndex?: number[];
};

type EmbeddedLessonQuizDraft = {
    version: number;
    lessonId: number;
    quizStarted: boolean;
    currentQuestionIndex: number;
    answers: Record<number, string>;
    hintedQuestions: Record<number, boolean>;
    questions: EmbeddedQuizQuestion[];
};

type EmbeddedLessonQuizCompletedSnapshot = {
    version: number;
    lessonId: number;
    showSummary: boolean;
    currentQuestionIndex: number;
    answers: Record<number, string>;
    hintedQuestions: Record<number, boolean>;
    questions: EmbeddedQuizQuestion[];
    lastSubmittedResult: LessonQuizSubmitResponse;
    nextLessonStatus: "idle" | "preparing" | "ready" | "error";
    nextLessonMessage: string | null;
};

const HINT_UNLOCK_AFTER_FAILURES = 2;
const HINT_CREDIT = 0.75;
const EMBEDDED_LESSON_QUIZ_DRAFT_VERSION = 2;
const EMBEDDED_LESSON_QUIZ_COMPLETED_VERSION = 2;

function getEmbeddedLessonQuizDraftStorageKey(userId: number, lessonId: number) {
    return `learning-embedded-quiz-draft:${userId}:${lessonId}`;
}

function getEmbeddedLessonQuizCompletedStorageKey(userId: number, lessonId: number) {
    return `learning-embedded-quiz-completed:${userId}:${lessonId}`;
}

function isEmbeddedQuizQuestion(value: unknown): value is EmbeddedQuizQuestion {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const question = value as Record<string, unknown>;
    return (
        typeof question.id === "string"
        && (
            question.type === "fill_blank"
            || question.type === "multi_select"
            || question.type === "ordering"
        )
        && Array.isArray(question.data)
    );
}

function isEmbeddedLessonQuizDraft(value: unknown): value is EmbeddedLessonQuizDraft {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const draft = value as Record<string, unknown>;
    return (
        typeof draft.version === "number"
        && typeof draft.lessonId === "number"
        && typeof draft.quizStarted === "boolean"
        && typeof draft.currentQuestionIndex === "number"
        && draft.answers !== null
        && typeof draft.answers === "object"
        && !Array.isArray(draft.answers)
        && draft.hintedQuestions !== null
        && typeof draft.hintedQuestions === "object"
        && !Array.isArray(draft.hintedQuestions)
        && Array.isArray(draft.questions)
        && draft.questions.every(isEmbeddedQuizQuestion)
    );
}

function isLessonQuizSubmitResponseLike(value: unknown): value is LessonQuizSubmitResponse {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const response = value as Record<string, unknown>;
    return (
        typeof response.lesson_id === "number"
        && typeof response.skill === "string"
        && typeof response.status === "string"
        && typeof response.lesson_passed === "boolean"
        && typeof response.best_score_percent === "number"
        && typeof response.attempt_count === "number"
        && typeof response.failed_attempts === "number"
        && (response.completed_at === null || typeof response.completed_at === "string")
        && (response.current_skill_score === null || typeof response.current_skill_score === "number")
        && (response.first_pass_score_percent === null || typeof response.first_pass_score_percent === "number")
        && typeof response.current_attempt_passed === "boolean"
        && typeof response.weighted_score_percent === "number"
        && typeof response.correct_no_hint_count === "number"
        && typeof response.correct_with_hint_count === "number"
        && typeof response.total_questions === "number"
        && typeof response.first_pass_radar_applied === "boolean"
        && typeof response.current_attempt_is_new_best === "boolean"
        && Array.isArray(response.question_results)
    );
}

function isEmbeddedLessonQuizCompletedSnapshot(
    value: unknown,
): value is EmbeddedLessonQuizCompletedSnapshot {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const snapshot = value as Record<string, unknown>;
    return (
        typeof snapshot.version === "number"
        && typeof snapshot.lessonId === "number"
        && typeof snapshot.showSummary === "boolean"
        && typeof snapshot.currentQuestionIndex === "number"
        && snapshot.answers !== null
        && typeof snapshot.answers === "object"
        && !Array.isArray(snapshot.answers)
        && snapshot.hintedQuestions !== null
        && typeof snapshot.hintedQuestions === "object"
        && !Array.isArray(snapshot.hintedQuestions)
        && Array.isArray(snapshot.questions)
        && snapshot.questions.every(isEmbeddedQuizQuestion)
        && isLessonQuizSubmitResponseLike(snapshot.lastSubmittedResult)
        && (
            snapshot.nextLessonStatus === "idle"
            || snapshot.nextLessonStatus === "preparing"
            || snapshot.nextLessonStatus === "ready"
            || snapshot.nextLessonStatus === "error"
        )
        && (snapshot.nextLessonMessage === null || typeof snapshot.nextLessonMessage === "string")
    );
}

function readEmbeddedLessonQuizDraft(
    userId: number,
    lessonId: number,
): EmbeddedLessonQuizDraft | null {
    try {
        const raw: unknown = JSON.parse(
            localStorage.getItem(getEmbeddedLessonQuizDraftStorageKey(userId, lessonId)) ?? "null",
        );

        if (!isEmbeddedLessonQuizDraft(raw)) {
            return null;
        }

        return raw.version === EMBEDDED_LESSON_QUIZ_DRAFT_VERSION ? raw : null;
    } catch {
        return null;
    }
}

function writeEmbeddedLessonQuizDraft(
    userId: number,
    lessonId: number,
    draft: EmbeddedLessonQuizDraft,
) {
    try {
        localStorage.setItem(
            getEmbeddedLessonQuizDraftStorageKey(userId, lessonId),
            JSON.stringify(draft),
        );
    } catch {
        // Ignore storage errors and keep the quiz usable.
    }
}

function readEmbeddedLessonQuizCompletedSnapshot(
    userId: number,
    lessonId: number,
): EmbeddedLessonQuizCompletedSnapshot | null {
    try {
        const raw: unknown = JSON.parse(
            localStorage.getItem(getEmbeddedLessonQuizCompletedStorageKey(userId, lessonId)) ?? "null",
        );

        if (!isEmbeddedLessonQuizCompletedSnapshot(raw)) {
            return null;
        }

        return raw.version === EMBEDDED_LESSON_QUIZ_COMPLETED_VERSION ? raw : null;
    } catch {
        return null;
    }
}

function writeEmbeddedLessonQuizCompletedSnapshot(
    userId: number,
    lessonId: number,
    snapshot: EmbeddedLessonQuizCompletedSnapshot,
) {
    try {
        localStorage.setItem(
            getEmbeddedLessonQuizCompletedStorageKey(userId, lessonId),
            JSON.stringify(snapshot),
        );
    } catch {
        // Ignore storage errors and keep the quiz usable.
    }
}

function clearEmbeddedLessonQuizDraft(userId: number, lessonId: number) {
    try {
        localStorage.removeItem(
            getEmbeddedLessonQuizDraftStorageKey(userId, lessonId),
        );
    } catch {
        // Ignore storage errors and keep the quiz usable.
    }
}

function clearEmbeddedLessonQuizCompletedSnapshot(userId: number, lessonId: number) {
    try {
        localStorage.removeItem(
            getEmbeddedLessonQuizCompletedStorageKey(userId, lessonId),
        );
    } catch {
        // Ignore storage errors and keep the quiz usable.
    }
}

function isEmbeddedLessonQuizDraftCompatible(
    draft: EmbeddedLessonQuizDraft,
    lessonId: number,
    sourceQuestions: EmbeddedQuizQuestion[],
) {
    if (draft.lessonId !== lessonId) {
        return false;
    }

    if (draft.questions.length !== sourceQuestions.length) {
        return false;
    }

    const expectedIds = new Set(sourceQuestions.map((question) => question.id));
    return draft.questions.every((question) => expectedIds.has(question.id));
}

function isEmbeddedLessonQuizCompletedSnapshotCompatible(
    snapshot: EmbeddedLessonQuizCompletedSnapshot,
    lessonId: number,
    sourceQuestions: EmbeddedQuizQuestion[],
) {
    if (snapshot.lessonId !== lessonId || snapshot.lastSubmittedResult.lesson_id !== lessonId) {
        return false;
    }

    if (snapshot.questions.length !== sourceQuestions.length) {
        return false;
    }

    const expectedIds = new Set(sourceQuestions.map((question) => question.id));
    return snapshot.questions.every((question) => expectedIds.has(question.id));
}

function buildSavedQuizStateFromSubmission(
    response: LessonQuizSubmitResponse,
): LessonQuizStateResponse {
    return {
        lesson_id: response.lesson_id,
        skill: response.skill,
        status: response.status,
        lesson_passed: response.lesson_passed,
        best_score_percent: response.best_score_percent,
        attempt_count: response.attempt_count,
        failed_attempts: response.failed_attempts,
        completed_at: response.completed_at,
        current_skill_score: response.current_skill_score,
        first_pass_score_percent: response.first_pass_score_percent,
    };
}

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

function formatPercent(value: number) {
    return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
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
        ...quiz.fillBlank.map((row, index) => {
            const shuffledRow = shuffleFillBlankRow(row);

            return {
                id: `fill-${index}`,
                type: "fill_blank" as const,
                data: [
                    ...shuffledRow,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                ] as FillBlankQuestionData,
            };
        }),
        ...quiz.multiSelect.map((row, index) => {
            const {
                row: shuffledRow,
                canonicalAnswer,
                displayAnswer,
                displayToCanonicalIndex,
                canonicalToDisplayIndex,
            } = shuffleMultiSelectRow(row);

            return {
                id: `multi-${index}`,
                type: "multi_select" as const,
                data: [
                    ...shuffledRow,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                ] as MultiSelectQuestionData,
                canonicalAnswer,
                displayAnswer,
                displayToCanonicalIndex,
                canonicalToDisplayIndex,
            };
        }),
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

function shuffleOptionEntries<T>(items: T[]) {
    const next = [...items];
    for (let index = next.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    }
    return next;
}

function shuffleFillBlankRow(row: QuizRow): QuizRow {
    const [stem, optionsStr, correctAnswer, explanation] = row;
    const shuffledOptions = shuffleOptionEntries(optionsStr.split("|"));

    return [stem, shuffledOptions.join("|"), correctAnswer, explanation];
}

function shuffleMultiSelectRow(row: QuizRow): {
    row: QuizRow;
    canonicalAnswer: string;
    displayAnswer: string;
    displayToCanonicalIndex: number[];
    canonicalToDisplayIndex: number[];
} {
    const [stem, optionsStr, answerStr, explanation] = row;
    const options = optionsStr.split("|");
    const correctIndices = answerStr
        .split("|")
        .map((part) => Number(part.trim()))
        .filter((value) => !Number.isNaN(value));
    const shuffledOptions = shuffleOptionEntries(
        options.map((option, index) => ({
            option,
            originalIndex: index,
        })),
    );
    const remappedAnswer = shuffledOptions
        .map((entry, index) => (
            correctIndices.includes(entry.originalIndex) ? index : null
        ))
        .filter((value): value is number => value !== null)
        .sort((left, right) => left - right)
        .join("|");
    const canonicalToDisplayIndex = options.map(() => -1);

    shuffledOptions.forEach((entry, displayIndex) => {
        canonicalToDisplayIndex[entry.originalIndex] = displayIndex;
    });

    return {
        row: [
            stem,
            shuffledOptions.map((entry) => entry.option).join("|"),
            remappedAnswer,
            explanation,
        ],
        canonicalAnswer: normalizeIndexAnswer(answerStr),
        displayAnswer: remappedAnswer,
        displayToCanonicalIndex: shuffledOptions.map((entry) => entry.originalIndex),
        canonicalToDisplayIndex,
    };
}

function hasAnswer(answer: string | undefined): answer is string {
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
        return normalizeIndexAnswer(answer ?? "") === getEmbeddedDisplayAnswer(question);
    }

    return answer === question.data[2];
}

function getEmbeddedDisplayAnswer(question: EmbeddedQuizQuestion) {
    if (question.type === "multi_select") {
        if (question.displayAnswer) {
            return normalizeIndexAnswer(question.displayAnswer);
        }

        if (question.canonicalAnswer && question.canonicalToDisplayIndex?.length) {
            return question.canonicalAnswer
                .split("|")
                .map((part) => Number(part.trim()))
                .filter((value) => !Number.isNaN(value))
                .map((canonicalIndex) => question.canonicalToDisplayIndex?.[canonicalIndex])
                .filter((value): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0)
                .sort((left, right) => left - right)
                .join("|");
        }
    }

    return question.data[2];
}

function getEmbeddedCorrectAnswer(question: EmbeddedQuizQuestion) {
    return getEmbeddedDisplayAnswer(question);
}

function getCanonicalSubmittedAnswer(
    question: EmbeddedQuizQuestion,
    answer: string | undefined,
) {
    if (!hasAnswer(answer)) {
        return "";
    }

    if (question.type !== "multi_select" || !question.displayToCanonicalIndex?.length) {
        return answer ?? "";
    }

    return answer
        .split("|")
        .map((part) => Number(part.trim()))
        .filter((value) => !Number.isNaN(value))
        .map((displayIndex) => question.displayToCanonicalIndex?.[displayIndex])
        .filter((value): value is number => Number.isInteger(value))
        .sort((left, right) => left - right)
        .join("|");
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

function findNextLesson(roadmap: RoadmapResponse | null, lessonId: number): LessonLookup | null {
    if (!roadmap) {
        return null;
    }

    const orderedLessons = roadmap.topics.flatMap((topic) =>
        topic.lessons.map((lesson) => ({
            track: roadmap.track,
            topic,
            lesson,
        })),
    );
    const currentIndex = orderedLessons.findIndex((item) => item.lesson.id === lessonId);

    if (currentIndex < 0 || currentIndex + 1 >= orderedLessons.length) {
        return null;
    }

    return orderedLessons[currentIndex + 1] ?? null;
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
                "w-full rounded-2xl border px-3 py-3 text-left transition-all sm:px-4",
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
            <header className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6 sm:py-5 dark:border-slate-800 dark:bg-slate-800/60">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
                    {eyebrow}
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
                    {title}
                </h2>
                {note ? (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        {note}
                    </p>
                ) : null}
            </header>
            <div className="space-y-6 p-4 sm:p-6">{children}</div>
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
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 sm:px-6 sm:py-10 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400">
                {message}
            </div>
        </PanelShell>
    );
}

// Nut trai tim luu tu vung vao bo flashcard ca nhan (bang user_flashcard).
function VocabularyHeartButton({
    saved,
    pending,
    onToggle,
}: {
    saved: boolean;
    pending: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            disabled={pending}
            aria-pressed={saved}
            aria-label={saved ? "Remove from flashcards" : "Save to flashcards"}
            title={saved ? "Remove from flashcards" : "Save to flashcards"}
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${saved
                ? "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50"
                : "bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                }`}
        >
            <Heart
                className={`h-4 w-4 ${saved ? "fill-current" : ""} ${pending ? "animate-pulse" : ""}`}
            />
        </button>
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

    // Flashcard state: word_eng -> saved row id. Loaded once so hearts render
    // filled for words this user has already saved (user_flashcard table).
    const [savedFlashcardIds, setSavedFlashcardIds] = useState<Record<string, number>>({});
    const [pendingWords, setPendingWords] = useState<Record<string, boolean>>({});
    const [flashcardError, setFlashcardError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const cards = await fetchFlashcards();
                if (cancelled) return;
                setSavedFlashcardIds(
                    Object.fromEntries(cards.map((card) => [card.word_eng, card.id])),
                );
            } catch {
                // Khong chan viec hoc: neu khong tai duoc thi tim de trong.
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const toggleFlashcard = useCallback(
        async (item: {
            term: string;
            ipa: string;
            meaning: string;
            explanation: string;
            example: string;
        }) => {
            // Cat theo dung gioi han cot cua user_flashcard de tranh loi 422.
            const word = item.term.trim().slice(0, 45);
            if (!word || pendingWords[word]) return;

            setPendingWords((prev) => ({ ...prev, [word]: true }));
            setFlashcardError(null);

            const savedId = savedFlashcardIds[word];
            try {
                if (savedId != null) {
                    await deleteFlashcard(savedId);
                    setSavedFlashcardIds((prev) => {
                        const next = { ...prev };
                        delete next[word];
                        return next;
                    });
                } else {
                    const created = await saveFlashcard({
                        word_eng: word,
                        word_vi: item.meaning.trim().slice(0, 50) || null,
                        transcription: item.ipa.trim().slice(0, 45) || null,
                        context: item.explanation.trim().slice(0, 500) || null,
                        workspace_example: item.example.trim().slice(0, 500) || null,
                    });
                    setSavedFlashcardIds((prev) => ({ ...prev, [word]: created.id }));
                }
            } catch (error) {
                setFlashcardError(
                    error instanceof Error
                        ? error.message
                        : "Could not update your flashcards.",
                );
            } finally {
                setPendingWords((prev) => {
                    const next = { ...prev };
                    delete next[word];
                    return next;
                });
            }
        },
        [pendingWords, savedFlashcardIds],
    );

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
            {flashcardError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                    {flashcardError}
                </div>
            )}
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
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{item.partOfSpeech}</Badge>
                                    <VocabularyHeartButton
                                        saved={savedFlashcardIds[item.term.trim().slice(0, 45)] != null}
                                        pending={pendingWords[item.term.trim().slice(0, 45)] === true}
                                        onToggle={() => void toggleFlashcard(item)}
                                    />
                                </div>
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
    const [listeningQuestionIndex, setListeningQuestionIndex] = useState<number | null>(null);
    const [aiFeedback, setAiFeedback] = useState<Record<number, string>>({});
    const [isEvaluating, setIsEvaluating] = useState<Record<number, boolean>>({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Web SpeechRecognition API has no TS types
    const recognitionRef = useRef<any>(null);

    const handleEvaluate = async (index: number, question: string, referenceAnswer: string) => {
        const userAnswer = draftAnswers[index]?.trim();
        if (!userAnswer) return;

        setIsEvaluating((prev) => ({ ...prev, [index]: true }));
        try {
            const res = await evaluateAnswer({
                section_type: "reading",
                context: section.primary,
                question: question,
                reference_answer: referenceAnswer,
                user_answer: userAnswer,
            });
            setAiFeedback((prev) => ({ ...prev, [index]: res.feedback_summary }));
        } catch (error) {
            console.error(error);
            alert("Failed to evaluate answer.");
        } finally {
            setIsEvaluating((prev) => ({ ...prev, [index]: false }));
        }
    };

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleDictation = (index: number) => {
        if (listeningQuestionIndex === index) {
            recognitionRef.current?.stop();
            setListeningQuestionIndex(null);
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        /* eslint-disable @typescript-eslint/no-explicit-any -- Web SpeechRecognition API has no TS types */
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;
        /* eslint-enable @typescript-eslint/no-explicit-any */

        if (!SpeechRecognition) {
            alert("Your browser does not support Speech Recognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Web SpeechRecognitionEvent has no TS types
        recognition.onresult = (event: any) => {
            let sessionTranscript = "";
            for (let i = 0; i < event.results.length; ++i) {
                sessionTranscript += event.results[i][0].transcript;
            }
            setDraftAnswers((prev) => ({
                ...prev,
                [index]: sessionTranscript,
            }));
        };

        recognition.onend = () => {
            setListeningQuestionIndex((prev) => (prev === index ? null : prev));
        };

        try {
            recognition.start();
            recognitionRef.current = recognition;
            setListeningQuestionIndex(index);
        } catch (error) {
            console.error("Speech recognition error:", error);
            setListeningQuestionIndex(null);
        }
    };

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

            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-slate-700 sm:px-5 dark:border-blue-900 dark:bg-blue-950/30 dark:text-slate-200">
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
                                    onClick={() => toggleDictation(index)}
                                    className={listeningQuestionIndex === index ? "text-rose-500 hover:text-rose-600 hover:bg-rose-50" : ""}
                                >
                                    {listeningQuestionIndex === index ? (
                                        <>
                                            <MicOff className="mr-2 h-4 w-4 animate-pulse" /> Stop Dictating
                                        </>
                                    ) : (
                                        <>
                                            <Mic className="mr-2 h-4 w-4" /> Dictate
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEvaluate(index, qa.question, qa.answer)}
                                    disabled={!draft || isEvaluating[index]}
                                >
                                    {isEvaluating[index] ? (
                                        "Evaluating..."
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4 text-indigo-500" /> Evaluate
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setDraftAnswers((prev) => ({
                                            ...prev,
                                            [index]: "",
                                        }));
                                        setAiFeedback((prev) => ({
                                            ...prev,
                                            [index]: "",
                                        }));
                                    }}
                                >
                                    Clear
                                </Button>
                            </div>

                            {aiFeedback[index] ? (
                                <div className="mt-4 rounded-2xl bg-indigo-50/50 p-4 text-sm leading-6 text-indigo-900 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/50 dark:text-indigo-100 animate-in fade-in slide-in-from-top-2">
                                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                                        <Sparkles className="h-3 w-3" /> AI Feedback
                                    </p>
                                    <p className="mt-2">{aiFeedback[index]}</p>
                                </div>
                            ) : null}

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

    const splitRegex = /(?:\s*\|\|\s*|\s*\|\s*)(?=Practice\s*Tasks\s*:)/i;
    const parts = section.secondary.split(splitRegex);

    if (parts.length > 1) {
        partA = parts[0];
        partB = parts.slice(1).join(" | ");
    } else if (section.secondary.includes(" || ")) {
        const fallbackParts = section.secondary.split(" || ");
        partA = fallbackParts[0];
        partB = fallbackParts.slice(1).join(" || ");
    }

    const highlights = parseDialogueHighlights(partA);
    const practiceTasks = partB
        ? splitPipe(partB.replace(/^Practice\s*Tasks\s*:\s*/i, ""))
        : [];

    const [userReplies, setUserReplies] = useState<Record<number, string>>({});
    const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
    const [listeningQuestionIndex, setListeningQuestionIndex] = useState<number | null>(null);
    const [aiFeedback, setAiFeedback] = useState<Record<number, string>>({});
    const [isEvaluating, setIsEvaluating] = useState<Record<number, boolean>>({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Web SpeechRecognition API has no TS types
    const recognitionRef = useRef<any>(null);

    const handleEvaluate = async (index: number, promptText: string, suggestedAnswer: string) => {
        const userAnswer = userReplies[index]?.trim();
        if (!userAnswer) return;

        setIsEvaluating((prev) => ({ ...prev, [index]: true }));
        try {
            const res = await evaluateAnswer({
                section_type: "dialogue",
                context: contextText,
                question: promptText,
                reference_answer: suggestedAnswer || "No reference answer provided.",
                user_answer: userAnswer,
            });
            setAiFeedback((prev) => ({ ...prev, [index]: res.feedback_summary }));
        } catch (error) {
            console.error(error);
            alert("Failed to evaluate answer.");
        } finally {
            setIsEvaluating((prev) => ({ ...prev, [index]: false }));
        }
    };

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleDictation = (index: number) => {
        if (listeningQuestionIndex === index) {
            recognitionRef.current?.stop();
            setListeningQuestionIndex(null);
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        /* eslint-disable @typescript-eslint/no-explicit-any -- Web SpeechRecognition API has no TS types */
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;
        /* eslint-enable @typescript-eslint/no-explicit-any */

        if (!SpeechRecognition) {
            alert("Your browser does not support Speech Recognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Web SpeechRecognitionEvent has no TS types
        recognition.onresult = (event: any) => {
            let sessionTranscript = "";
            for (let i = 0; i < event.results.length; ++i) {
                sessionTranscript += event.results[i][0].transcript;
            }
            setUserReplies((prev) => ({
                ...prev,
                [index]: sessionTranscript,
            }));
        };

        recognition.onend = () => {
            setListeningQuestionIndex((prev) => (prev === index ? null : prev));
        };

        try {
            recognition.start();
            recognitionRef.current = recognition;
            setListeningQuestionIndex(index);
        } catch (error) {
            console.error("Speech recognition error:", error);
            setListeningQuestionIndex(null);
        }
    };
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
                {lines.map((line, index) => {
                    const isEven = index % 2 === 0;
                    const speakerVoice = getDialogueVoiceForSpeaker(
                        line.speaker,
                        index
                    );

                    return (
                        <div
                            key={line.id}
                            className={[
                                "max-w-3xl rounded-3xl p-5 text-sm leading-7 shadow-sm",
                                isEven
                                    ? "mr-auto border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
                                    : "ml-auto bg-blue-600 text-white",
                            ].join(" ")}
                        >
                            <div className="mb-1.5 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-[0.18em] opacity-90">
                                        {line.speaker}
                                    </span>
                                </div>
                                <AudioSpeakButton
                                    text={line.text}
                                    voice={speakerVoice}
                                    className={
                                        isEven
                                            ? "inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-200"
                                            : "inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white hover:bg-white/30"
                                    }
                                />
                            </div>
                            <p>{line.text}</p>
                        </div>
                    );
                })}
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
                        {practiceTasks.map((taskRaw, idx) => {
                            const parts = taskRaw.split(/->\s*Suggested Answer:/i);
                            const promptText = parts[0].trim();
                            const suggestedAnswer = parts.length > 1 ? parts[1].trim() : null;
                            const isRevealed = Boolean(revealedAnswers[idx]);

                            return (
                                <div
                                    key={idx}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 shadow-sm"
                                >
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        {promptText}
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
                                    <div className="mt-2.5 flex justify-between items-center flex-wrap gap-2">
                                        <div>
                                            {suggestedAnswer && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setRevealedAnswers((prev) => ({
                                                            ...prev,
                                                            [idx]: !prev[idx],
                                                        }))
                                                    }
                                                >
                                                    {isRevealed ? "Hide answer" : "Show answer"}
                                                </Button>
                                            )}
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleDictation(idx)}
                                                className={listeningQuestionIndex === idx ? "text-rose-500 hover:text-rose-600 hover:bg-rose-50" : ""}
                                            >
                                                {listeningQuestionIndex === idx ? (
                                                    <>
                                                        <MicOff className="mr-2 h-4 w-4 animate-pulse" /> Stop Dictating
                                                    </>
                                                ) : (
                                                    <>
                                                        <Mic className="mr-2 h-4 w-4" /> Dictate
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEvaluate(idx, promptText, suggestedAnswer || "")}
                                                disabled={!userReplies[idx]?.trim() || isEvaluating[idx]}
                                            >
                                                {isEvaluating[idx] ? (
                                                    "Evaluating..."
                                                ) : (
                                                    <>
                                                        <Sparkles className="mr-2 h-4 w-4 text-indigo-500" /> Evaluate
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setUserReplies((prev) => ({
                                                        ...prev,
                                                        [idx]: "",
                                                    }));
                                                    setAiFeedback((prev) => ({
                                                        ...prev,
                                                        [idx]: "",
                                                    }));
                                                }}
                                            >
                                                Clear
                                            </Button>
                                            {userReplies[idx] && (
                                                <AudioSpeakButton
                                                    text={userReplies[idx]}
                                                    label="Listen to my response"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {aiFeedback[idx] ? (
                                        <div className="mt-4 rounded-2xl bg-indigo-50/50 p-4 text-sm leading-6 text-indigo-900 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/50 dark:text-indigo-100 animate-in fade-in slide-in-from-top-2">
                                            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                                                <Sparkles className="h-3 w-3" /> AI Feedback
                                            </p>
                                            <p className="mt-2">{aiFeedback[idx]}</p>
                                        </div>
                                    ) : null}

                                    {isRevealed && suggestedAnswer && (
                                        <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-slate-700 dark:bg-emerald-950/30 dark:text-slate-200 animate-in fade-in">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                                                Suggested answer
                                            </p>
                                            <p className="mt-1">{suggestedAnswer}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
    const [draftAnswers, setDraftAnswers] = useState<Record<number, string>>({});
    const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
    const [listeningQuestionIndex, setListeningQuestionIndex] = useState<number | null>(null);
    const [aiFeedback, setAiFeedback] = useState<Record<number, string>>({});
    const [isEvaluating, setIsEvaluating] = useState<Record<number, boolean>>({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Web SpeechRecognition API has no TS types
    const recognitionRef = useRef<any>(null);

    const rawScript = section.primary;
    const scriptText = rawScript
        .replace(/^Audio\s*Script\s*:\s*/i, "")
        .replace(/^\[.*?\]\s*:\s*/i, "")
        .replace(/^["']|["']$/g, "")
        .trim();

    const handleEvaluate = async (index: number, question: string, referenceAnswer: string) => {
        const userAnswer = draftAnswers[index]?.trim();
        if (!userAnswer) return;

        setIsEvaluating((prev) => ({ ...prev, [index]: true }));
        try {
            const res = await evaluateAnswer({
                section_type: "listening",
                context: scriptText,
                question: question,
                reference_answer: referenceAnswer,
                user_answer: userAnswer,
            });
            setAiFeedback((prev) => ({ ...prev, [index]: res.feedback_summary }));
        } catch (error) {
            console.error(error);
            alert("Failed to evaluate answer.");
        } finally {
            setIsEvaluating((prev) => ({ ...prev, [index]: false }));
        }
    };

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleDictation = (index: number) => {
        if (listeningQuestionIndex === index) {
            recognitionRef.current?.stop();
            setListeningQuestionIndex(null);
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        /* eslint-disable @typescript-eslint/no-explicit-any -- Web SpeechRecognition API has no TS types */
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;
        /* eslint-enable @typescript-eslint/no-explicit-any */

        if (!SpeechRecognition) {
            alert("Your browser does not support Speech Recognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Web SpeechRecognitionEvent has no TS types
        recognition.onresult = (event: any) => {
            let sessionTranscript = "";
            for (let i = 0; i < event.results.length; ++i) {
                sessionTranscript += event.results[i][0].transcript;
            }
            setDraftAnswers((prev) => ({
                ...prev,
                [index]: sessionTranscript,
            }));
        };

        recognition.onend = () => {
            setListeningQuestionIndex((prev) => (prev === index ? null : prev));
        };

        try {
            recognition.start();
            recognitionRef.current = recognition;
            setListeningQuestionIndex(index);
        } catch (error) {
            console.error("Speech recognition error:", error);
            setListeningQuestionIndex(null);
        }
    };

    const questions = parseReadingQuestions(section.secondary);

    return (
        <PanelShell eyebrow="Section 6" title={section.label} note={section.note}>
            {/* Rich Multi-Accent Neural Audio Player with Slower Speed Controls */}
            <ListeningAudioPlayer
                scriptText={scriptText}
                rawTranscript={rawScript}
                title="Workplace Audio Track"
                subtitle="Authentic Spoken Workplace Monologue"
            />

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
                                    onClick={() => toggleDictation(index)}
                                    className={listeningQuestionIndex === index ? "text-rose-500 hover:text-rose-600 hover:bg-rose-50" : ""}
                                >
                                    {listeningQuestionIndex === index ? (
                                        <>
                                            <MicOff className="mr-2 h-4 w-4 animate-pulse" /> Stop Dictating
                                        </>
                                    ) : (
                                        <>
                                            <Mic className="mr-2 h-4 w-4" /> Dictate
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEvaluate(index, qa.question, qa.answer)}
                                    disabled={!draft || isEvaluating[index]}
                                >
                                    {isEvaluating[index] ? (
                                        "Evaluating..."
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4 text-indigo-500" /> Evaluate
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setDraftAnswers((prev) => ({
                                            ...prev,
                                            [index]: "",
                                        }));
                                        setAiFeedback((prev) => ({
                                            ...prev,
                                            [index]: "",
                                        }));
                                    }}
                                >
                                    Clear
                                </Button>
                            </div>

                            {aiFeedback[index] ? (
                                <div className="mt-4 rounded-2xl bg-indigo-50/50 p-4 text-sm leading-6 text-indigo-900 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/50 dark:text-indigo-100 animate-in fade-in slide-in-from-top-2">
                                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                                        <Sparkles className="h-3 w-3" /> AI Feedback
                                    </p>
                                    <p className="mt-2">{aiFeedback[index]}</p>
                                </div>
                            ) : null}

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
                                <div className="min-w-0">
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

function EmbeddedLessonQuiz({
    lessonId,
    quiz,
    nextLesson,
    isActive,
    lessonView,
    onLessonViewRequest,
    onQuizViewStateChange,
    onNavigationGuardChange,
}: {
    lessonId: number;
    quiz: ParsedQuiz | null;
    nextLesson: LessonLookup | null;
    isActive: boolean;
    lessonView: LessonHistoryView | null;
    onLessonViewRequest?: (
        nextView: LessonHistoryView,
        historyMode?: "push" | "replace",
    ) => void;
    onQuizViewStateChange?: (view: LessonHistoryView) => void;
    onNavigationGuardChange?: (active: boolean) => void;
}) {
    const auth = useAuth();
    const userId = Number(auth.user?.id);
    const { reinitialize: reinitializeRadar } = useRadar();
    const sourceQuestions = useMemo(
        () => buildEmbeddedQuizQuestions(quiz),
        [quiz],
    );
    const [questions, setQuestions] = useState<EmbeddedQuizQuestion[]>(
        () => shuffleQuestions(sourceQuestions),
    );
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
    const [quizStarted, setQuizStarted] = useState(false);
    const [pendingDraft, setPendingDraft] = useState<EmbeddedLessonQuizDraft | null>(null);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [hintedQuestions, setHintedQuestions] = useState<Record<number, boolean>>({});
    const [nextLessonStatus, setNextLessonStatus] = useState<"idle" | "preparing" | "ready" | "error">("idle");
    const [nextLessonMessage, setNextLessonMessage] = useState<string | null>(null);
    const [savedQuizState, setSavedQuizState] = useState<LessonQuizStateResponse | null>(null);
    const [lastSubmittedResult, setLastSubmittedResult] = useState<LessonQuizSubmitResponse | null>(null);
    const [quizStateError, setQuizStateError] = useState<string | null>(null);
    const [savingAttempt, setSavingAttempt] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const questionNavigatorRef = useRef<HTMLDivElement | null>(null);
    const activeQuestionButtonRef = useRef<HTMLButtonElement | null>(null);
    const activeQuestionRef = useRef<HTMLDivElement | null>(null);
    const previousQuestionIndexRef = useRef(0);
    const navigatorScrollFrameRef = useRef<number | null>(null);
    const navigatorScrollTargetRef = useRef(0);

    const stopQuestionNavigatorAnimation = useCallback(() => {
        if (navigatorScrollFrameRef.current !== null) {
            window.cancelAnimationFrame(navigatorScrollFrameRef.current);
            navigatorScrollFrameRef.current = null;
        }

        const navigator = questionNavigatorRef.current;
        navigatorScrollTargetRef.current = navigator?.scrollLeft ?? 0;
    }, []);

    const requestLessonView = useCallback((
        nextView: LessonHistoryView,
        historyMode: "push" | "replace" = "replace",
    ) => {
        onLessonViewRequest?.(nextView, historyMode);
    }, [onLessonViewRequest]);

    const requestQuizView = useCallback((
        quizMode: LessonQuizMode,
        questionIndex?: number,
        historyMode: "push" | "replace" = "replace",
    ) => {
        requestLessonView(
            buildLessonHistoryView(lessonId, "quiz", quizMode, questionIndex),
            historyMode,
        );
    }, [lessonId, requestLessonView]);

    const openSummaryView = useCallback((
        historyMode: "push" | "replace" = "replace",
    ) => {
        setShowSummary(true);
        requestQuizView("summary", undefined, historyMode);
    }, [requestQuizView]);

    const openReviewQuestion = useCallback((
        index: number,
        historyMode: "push" | "replace" = "replace",
    ) => {
        setCurrentQuestionIndex(index);
        setShowSummary(false);
        requestQuizView("review", index, historyMode);
    }, [requestQuizView]);

    const resetAttemptState = useCallback(() => {
        setCurrentQuestionIndex(0);
        setAnswers({});
        setSubmitted(false);
        setShowSummary(false);
        setShowIncompleteWarning(false);
        setHintedQuestions({});
        setLastSubmittedResult(null);
        setSaveError(null);
    }, []);

    const backendQuestionResultsById = useMemo(
        () =>
            new Map(
                (lastSubmittedResult?.question_results ?? []).map((result) => [
                    result.question_id,
                    result,
                ]),
            ),
        [lastSubmittedResult?.question_results],
    );

    const currentQuizView = useMemo(() => {
        if (!quizStarted) {
            return buildLessonHistoryView(lessonId, "quiz", "intro");
        }

        if (!submitted) {
            return buildLessonHistoryView(
                lessonId,
                "quiz",
                "question",
                currentQuestionIndex,
            );
        }

        return buildLessonHistoryView(
            lessonId,
            "quiz",
            showSummary ? "summary" : "review",
            showSummary ? null : currentQuestionIndex,
        );
    }, [currentQuestionIndex, lessonId, quizStarted, showSummary, submitted]);

    useEffect(() => {
        let cancelled = false;
        const freshQuestions = shuffleQuestions(sourceQuestions);

        resetAttemptState();
        setQuestions(freshQuestions);
        setPendingDraft(null);
        setQuizStarted(false);
        setFailedAttempts(0);
        setNextLessonStatus(nextLesson?.lesson.is_generated ? "ready" : "idle");
        setNextLessonMessage(null);
        setSavedQuizState(null);
        setQuizStateError(null);
        setSavingAttempt(false);

        if (Number.isFinite(userId) && sourceQuestions.length > 0) {
            const completedSnapshot = readEmbeddedLessonQuizCompletedSnapshot(userId, lessonId);

            if (
                completedSnapshot
                && isEmbeddedLessonQuizCompletedSnapshotCompatible(
                    completedSnapshot,
                    lessonId,
                    sourceQuestions,
                )
            ) {
                setQuestions(completedSnapshot.questions);
                setCurrentQuestionIndex(
                    Math.min(
                        Math.max(0, completedSnapshot.currentQuestionIndex),
                        Math.max(0, completedSnapshot.questions.length - 1),
                    ),
                );
                setAnswers(completedSnapshot.answers);
                setHintedQuestions(completedSnapshot.hintedQuestions);
                setLastSubmittedResult(completedSnapshot.lastSubmittedResult);
                setSavedQuizState(buildSavedQuizStateFromSubmission(completedSnapshot.lastSubmittedResult));
                setFailedAttempts(completedSnapshot.lastSubmittedResult.failed_attempts);
                setNextLessonStatus(completedSnapshot.nextLessonStatus);
                setNextLessonMessage(completedSnapshot.nextLessonMessage);
                setQuizStarted(true);
                setSubmitted(true);
                setShowSummary(completedSnapshot.showSummary);
                return () => {
                    cancelled = true;
                };
            } else if (completedSnapshot) {
                clearEmbeddedLessonQuizCompletedSnapshot(userId, lessonId);
            }

            const savedDraft = readEmbeddedLessonQuizDraft(userId, lessonId);

            if (
                savedDraft
                && isEmbeddedLessonQuizDraftCompatible(savedDraft, lessonId, sourceQuestions)
            ) {
                setQuestions(savedDraft.questions);
                const nextDraftIndex = Math.min(
                    Math.max(0, savedDraft.currentQuestionIndex),
                    Math.max(0, savedDraft.questions.length - 1),
                );
                setCurrentQuestionIndex(
                    nextDraftIndex,
                );
                setAnswers(savedDraft.answers);
                setHintedQuestions(savedDraft.hintedQuestions);
                if (
                    lessonView?.lessonId === lessonId
                    && lessonView.section === "quiz"
                    && lessonView.quizMode === "question"
                ) {
                    setPendingDraft(null);
                    setQuizStarted(true);
                    setSubmitted(false);
                    setShowSummary(false);
                } else {
                    setPendingDraft(savedDraft);
                }
            } else if (savedDraft) {
                clearEmbeddedLessonQuizDraft(userId, lessonId);
            }
        }

        void fetchLessonQuizState(lessonId)
            .then((state) => {
                if (cancelled) {
                    return;
                }
                setSavedQuizState(state);
                setFailedAttempts(state.failed_attempts);
            })
            .catch((stateError) => {
                if (cancelled) {
                    return;
                }
                setQuizStateError(
                    stateError instanceof Error
                        ? stateError.message
                        : "Could not load saved lesson quiz status.",
                );
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        lessonId,
        nextLesson?.lesson.id,
        nextLesson?.lesson.is_generated,
        resetAttemptState,
        sourceQuestions,
        userId,
    ]);

    useEffect(() => {
        if (!Number.isFinite(userId) || !quizStarted || submitted || questions.length === 0) {
            return;
        }

        writeEmbeddedLessonQuizDraft(userId, lessonId, {
            version: EMBEDDED_LESSON_QUIZ_DRAFT_VERSION,
            lessonId,
            quizStarted,
            currentQuestionIndex,
            answers,
            hintedQuestions,
            questions,
        });
    }, [
        answers,
        currentQuestionIndex,
        hintedQuestions,
        lessonId,
        questions,
        quizStarted,
        submitted,
        userId,
    ]);

    useEffect(() => {
        if (
            !Number.isFinite(userId)
            || !quizStarted
            || !submitted
            || !lastSubmittedResult
            || questions.length === 0
        ) {
            return;
        }

        writeEmbeddedLessonQuizCompletedSnapshot(userId, lessonId, {
            version: EMBEDDED_LESSON_QUIZ_COMPLETED_VERSION,
            lessonId,
            showSummary,
            currentQuestionIndex,
            answers,
            hintedQuestions,
            questions,
            lastSubmittedResult,
            nextLessonStatus,
            nextLessonMessage,
        });
    }, [
        answers,
        currentQuestionIndex,
        hintedQuestions,
        lastSubmittedResult,
        lessonId,
        nextLessonMessage,
        nextLessonStatus,
        questions,
        quizStarted,
        showSummary,
        submitted,
        userId,
    ]);

    useEffect(() => {
        onQuizViewStateChange?.(currentQuizView);
    }, [currentQuizView, onQuizViewStateChange]);

    useEffect(() => {
        onNavigationGuardChange?.(quizStarted && !submitted);

        return () => {
            onNavigationGuardChange?.(false);
        };
    }, [onNavigationGuardChange, quizStarted, submitted]);

    useEffect(() => {
        if (
            !lessonView
            || lessonView.lessonId !== lessonId
            || lessonView.section !== "quiz"
        ) {
            return;
        }

        const nextIndex = Math.min(
            Math.max(0, Number(lessonView.questionIndex ?? 0)),
            Math.max(0, questions.length - 1),
        );
        const submittedFallbackView = buildLessonHistoryView(
            lessonId,
            "quiz",
            "summary",
        );

        switch (lessonView.quizMode ?? "intro") {
            case "intro": {
                if (submitted) {
                    if (!showSummary) {
                        setShowSummary(true);
                    }
                    requestLessonView(submittedFallbackView, "replace");
                    return;
                }
                if (quizStarted) setQuizStarted(false);
                if (submitted) setSubmitted(false);
                if (showSummary) setShowSummary(false);
                if (currentQuestionIndex !== 0) setCurrentQuestionIndex(0);
                return;
            }
            case "question": {
                if (submitted) {
                    if (!showSummary) {
                        setShowSummary(true);
                    }
                    requestLessonView(submittedFallbackView, "replace");
                    return;
                }
                if (!quizStarted) setQuizStarted(true);
                if (pendingDraft) setPendingDraft(null);
                if (showSummary) setShowSummary(false);
                if (currentQuestionIndex !== nextIndex) setCurrentQuestionIndex(nextIndex);
                return;
            }
            case "summary": {
                if (!quizStarted) setQuizStarted(true);
                if (pendingDraft) setPendingDraft(null);
                if (!submitted) return;
                if (!showSummary) setShowSummary(true);
                return;
            }
            case "review": {
                if (!quizStarted) setQuizStarted(true);
                if (pendingDraft) setPendingDraft(null);
                if (!submitted) return;
                if (showSummary) setShowSummary(false);
                if (currentQuestionIndex !== nextIndex) setCurrentQuestionIndex(nextIndex);
                return;
            }
        }
    }, [
        currentQuestionIndex,
        lessonId,
        lessonView,
        pendingDraft,
        questions.length,
        quizStarted,
        requestLessonView,
        showSummary,
        submitted,
    ]);

    useEffect(() => {
        if (
            !quizStarted
            || !nextLesson
            || nextLesson.lesson.is_generated
            || nextLessonStatus !== "preparing"
        ) {
            return;
        }

        let cancelled = false;

        const checkNextLesson = async () => {
            try {
                const updatedRoadmap = await fetchRoadmap();
                if (cancelled) {
                    return;
                }

                const updatedNextLesson = findLesson(updatedRoadmap, nextLesson.lesson.id);
                if (updatedNextLesson?.lesson.is_generated) {
                    setNextLessonStatus("ready");
                    setNextLessonMessage(
                        `${updatedNextLesson.lesson.title} is ready for you to continue immediately after the quiz.`,
                    );
                }
            } catch {
                // Keep the warmup status as-is; the user can still finish the quiz.
            }
        };

        void checkNextLesson();
        const intervalId = window.setInterval(() => {
            void checkNextLesson();
        }, 15000);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [nextLesson, nextLessonStatus, quizStarted]);

    useEffect(() => {
        if (!quizStarted || showSummary) {
            previousQuestionIndexRef.current = currentQuestionIndex;
            return;
        }

        const questionChanged = previousQuestionIndexRef.current !== currentQuestionIndex;
        previousQuestionIndexRef.current = currentQuestionIndex;

        if (!questionChanged) {
            return;
        }

        const frameId = window.requestAnimationFrame(() => {
            activeQuestionRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        });

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [currentQuestionIndex, quizStarted, showSummary]);

    useEffect(() => {
        if (!quizStarted || showSummary) {
            return;
        }

        const frameId = window.requestAnimationFrame(() => {
            const navigator = questionNavigatorRef.current;
            const activeButton = activeQuestionButtonRef.current;

            if (!navigator || !activeButton || !navigator.contains(activeButton)) {
                return;
            }

            activeButton.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center",
            });
        });

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [currentQuestionIndex, quizStarted, showSummary]);

    const animateQuestionNavigatorScroll = useCallback(() => {
        const navigator = questionNavigatorRef.current;
        if (!navigator) {
            navigatorScrollFrameRef.current = null;
            return;
        }

        const distance = navigatorScrollTargetRef.current - navigator.scrollLeft;

        if (Math.abs(distance) < 0.5) {
            navigator.scrollLeft = navigatorScrollTargetRef.current;
            navigatorScrollFrameRef.current = null;
            return;
        }

        navigator.scrollLeft += distance * 0.14;
        navigatorScrollFrameRef.current = window.requestAnimationFrame(animateQuestionNavigatorScroll);
    }, []);

    const handleQuestionNavigatorWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
        const navigator = questionNavigatorRef.current;
        if (!navigator) {
            return;
        }

        const horizontalDelta = event.deltaX;
        const verticalDelta = event.deltaY;
        const primaryDelta = Math.abs(verticalDelta) > Math.abs(horizontalDelta)
            ? verticalDelta
            : horizontalDelta;

        if (primaryDelta === 0) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        const maxScrollLeft = Math.max(0, navigator.scrollWidth - navigator.clientWidth);
        const baseScrollLeft = navigatorScrollFrameRef.current === null
            ? navigator.scrollLeft
            : navigatorScrollTargetRef.current;
        navigatorScrollTargetRef.current = Math.min(
            maxScrollLeft,
            Math.max(0, baseScrollLeft + primaryDelta * 1.1),
        );

        if (navigatorScrollFrameRef.current === null) {
            navigatorScrollFrameRef.current = window.requestAnimationFrame(animateQuestionNavigatorScroll);
        }
    }, [animateQuestionNavigatorScroll]);

    useEffect(() => stopQuestionNavigatorAnimation, [stopQuestionNavigatorAnimation]);

    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestionIndex];
    const totalQuestions = questions.length;
    const answeredCount = Object.values(answers).filter((value) => hasAnswer(value)).length;
    const unansweredCount = totalQuestions - answeredCount;
    const hintModeUnlocked = failedAttempts >= HINT_UNLOCK_AFTER_FAILURES;
    const hintedCount = Object.values(hintedQuestions).filter(Boolean).length;
    const currentQuestionHintUsed = Boolean(hintedQuestions[currentQuestionIndex]);
    const correctNoHintCount = questions.reduce(
        (count, question, index) =>
            count
            + (
                submitted
                    && isEmbeddedAnswerCorrect(question, answers[index])
                    && !hintedQuestions[index]
                    ? 1
                    : 0
            ),
        0,
    );
    const correctWithHintCount = questions.reduce(
        (count, question, index) =>
            count
            + (
                submitted
                    && isEmbeddedAnswerCorrect(question, answers[index])
                    && hintedQuestions[index]
                    ? 1
                    : 0
            ),
        0,
    );
    const correctCount = correctNoHintCount + correctWithHintCount;
    const weightedScore =
        totalQuestions > 0
            ? (correctNoHintCount + HINT_CREDIT * correctWithHintCount) / totalQuestions
            : 0;
    const progressValue = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
    const nextLessonIsReady = nextLessonStatus === "ready" || Boolean(nextLesson?.lesson.is_generated);
    const savedAttemptCount = savedQuizState?.attempt_count ?? 0;
    const savedBestScore = savedQuizState?.best_score_percent ?? 0;
    const firstUnansweredQuestionIndex = questions.findIndex(
        (_, index) => !hasAnswer(answers[index]),
    );

    const kickoffNextLessonPreparation = () => {
        if (!nextLesson) {
            setNextLessonStatus("idle");
            setNextLessonMessage("This is the last assigned lesson in your current roadmap.");
            return;
        }

        if (nextLesson.lesson.is_generated) {
            setNextLessonStatus("ready");
            setNextLessonMessage(
                `${nextLesson.lesson.title} is already ready, so you can continue as soon as you finish this quiz.`,
            );
            return;
        }

        setNextLessonStatus("preparing");
        setNextLessonMessage(
            `Preparing ${nextLesson.lesson.title} in the background while you take this quiz.`,
        );

        void kickoffRoadmapLessonGeneration(nextLesson.lesson.id)
            .then((result) => {
                if (result.status === "completed") {
                    setNextLessonStatus("ready");
                    setNextLessonMessage(
                        `${nextLesson.lesson.title} is ready for you to open next.`,
                    );
                    return;
                }

                setNextLessonStatus("preparing");
                setNextLessonMessage(result.message);
            })
            .catch((generationError) => {
                setNextLessonStatus("error");
                setNextLessonMessage(
                    generationError instanceof Error
                        ? generationError.message
                        : "Could not start next lesson generation.",
                );
            });
    };

    const handleStartQuiz = () => {
        setPendingDraft(null);
        setCurrentQuestionIndex(0);
        setSubmitted(false);
        setShowSummary(false);
        setQuizStarted(true);
        kickoffNextLessonPreparation();
        requestQuizView("question", 0, "push");
    };

    const handleResumeQuiz = () => {
        if (!pendingDraft) {
            handleStartQuiz();
            return;
        }

        setPendingDraft(null);
        setShowSummary(false);
        setQuizStarted(true);
        kickoffNextLessonPreparation();
        requestQuizView("question", currentQuestionIndex, "replace");
    };

    const handleStartOver = () => {
        resetAttemptState();
        setQuestions(shuffleQuestions(sourceQuestions));
        setPendingDraft(null);
        setQuizStarted(false);
        setNextLessonStatus(nextLesson?.lesson.is_generated ? "ready" : "idle");
        setNextLessonMessage(null);
        if (Number.isFinite(userId)) {
            clearEmbeddedLessonQuizDraft(userId, lessonId);
            clearEmbeddedLessonQuizCompletedSnapshot(userId, lessonId);
        }
        requestQuizView("intro", undefined, "replace");
    };

    const handleRestart = () => {
        resetAttemptState();
        setQuestions(shuffleQuestions(sourceQuestions));
        setPendingDraft(null);
        setQuizStarted(false);
        setNextLessonStatus(nextLesson?.lesson.is_generated ? "ready" : "idle");
        setNextLessonMessage(null);
        if (Number.isFinite(userId)) {
            clearEmbeddedLessonQuizDraft(userId, lessonId);
            clearEmbeddedLessonQuizCompletedSnapshot(userId, lessonId);
        }
        requestQuizView("intro", undefined, "replace");
    };

    const isQuestionCorrect = (question: EmbeddedQuizQuestion, index: number) =>
        backendQuestionResultsById.get(question.id)?.is_correct
        ?? isEmbeddedAnswerCorrect(question, answers[index]);

    const submittedResult = submitted ? lastSubmittedResult : null;
    const lessonPassed = submitted
        ? (submittedResult?.lesson_passed ?? false)
        : (savedQuizState?.lesson_passed ?? false);
    const currentAttemptPassed = submitted
        ? (submittedResult?.current_attempt_passed ?? false)
        : false;
    const displayedWeightedScorePercent = submitted
        ? (submittedResult?.weighted_score_percent ?? 0)
        : weightedScore * 100;
    const displayedCorrectNoHintCount = submitted
        ? (submittedResult?.correct_no_hint_count ?? 0)
        : correctNoHintCount;
    const displayedCorrectWithHintCount = submitted
        ? (submittedResult?.correct_with_hint_count ?? 0)
        : correctWithHintCount;
    const displayedCorrectCount = submitted
        ? displayedCorrectNoHintCount + displayedCorrectWithHintCount
        : correctCount;

    const finalizeSubmission = useCallback(async () => {
        if (savingAttempt) {
            return;
        }

        setSavingAttempt(true);
        setSaveError(null);

        try {
            const response = await submitLessonQuiz(lessonId, {
                question_order: questions.map((question) => question.id),
                answers: questions.map((question, index) => ({
                    question_id: question.id,
                    question_type: question.type,
                    answer: getCanonicalSubmittedAnswer(question, answers[index]),
                    used_hint: Boolean(hintedQuestions[index]),
                })),
            });

            setLastSubmittedResult(response);
            setSavedQuizState(buildSavedQuizStateFromSubmission(response));
            setFailedAttempts(response.failed_attempts);

            if (response.first_pass_radar_applied || response.lesson_passed) {
                await reinitializeRadar(true);
            }

            try {
                const updatedProfile = await fetchCurrentUserProfile();
                window.dispatchEvent(
                    new CustomEvent("careerpath:profile-updated", {
                        detail: updatedProfile,
                    }),
                );
            } catch {
                // Keep quiz success intact even if the profile refresh fails.
            }

            if (Number.isFinite(userId)) {
                clearEmbeddedLessonQuizDraft(userId, lessonId);
            }

            setSubmitted(true);
            setPendingDraft(null);
            openSummaryView("replace");
            setShowIncompleteWarning(false);
        } catch (submissionError) {
            setSaveError(
                submissionError instanceof Error
                    ? submissionError.message
                    : "Could not save this quiz attempt.",
            );
        } finally {
            setSavingAttempt(false);
        }
    }, [
        answers,
        hintedQuestions,
        lessonId,
        openSummaryView,
        questions,
        reinitializeRadar,
        savingAttempt,
        userId,
    ]);

    const handleSubmitQuiz = useCallback(() => {
        if (unansweredCount > 0) {
            setShowIncompleteWarning(true);
            return;
        }

        void finalizeSubmission();
    }, [finalizeSubmission, unansweredCount]);

    const handleConfirmSubmitQuiz = () => {
        void finalizeSubmission();
    };

    const handleGoToFirstUnansweredQuestion = () => {
        if (firstUnansweredQuestionIndex < 0) {
            return;
        }

        setShowIncompleteWarning(false);
        setCurrentQuestionIndex(firstUnansweredQuestionIndex);
        requestQuizView("question", firstUnansweredQuestionIndex, "push");
    };

    const handleAdvanceQuestion = useCallback(() => {
        if (savingAttempt || showIncompleteWarning) {
            return;
        }

        if (submitted) {
            if (!isLastQuestion) {
                const nextIndex = Math.min(totalQuestions - 1, currentQuestionIndex + 1);
                openReviewQuestion(nextIndex, "replace");
                return;
            }

            const currentMode =
                lessonView?.lessonId === lessonId
                    && lessonView.section === "quiz"
                    ? lessonView.quizMode
                    : undefined;

            if (currentMode === "review") {
                window.history.back();
                return;
            }

            openSummaryView("replace");
            return;
        }

        if (isLastQuestion) {
            handleSubmitQuiz();
            return;
        }

        const nextIndex = Math.min(totalQuestions - 1, currentQuestionIndex + 1);
        setCurrentQuestionIndex(nextIndex);
        requestQuizView("question", nextIndex, "push");
    }, [
        currentQuestionIndex,
        handleSubmitQuiz,
        isLastQuestion,
        lessonId,
        lessonView,
        openReviewQuestion,
        openSummaryView,
        requestQuizView,
        savingAttempt,
        showIncompleteWarning,
        submitted,
        totalQuestions,
    ]);

    const handleRevealHint = () => {
        if (submitted || !hintModeUnlocked) {
            return;
        }

        setHintedQuestions((prev) => ({ ...prev, [currentQuestionIndex]: true }));
        setAnswers((prev) => ({
            ...prev,
            [currentQuestionIndex]: getEmbeddedCorrectAnswer(currentQuestion),
        }));
    };

    useEffect(() => {
        if (!isActive || !quiz || questions.length === 0) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.key !== "Enter"
                || event.shiftKey
                || event.ctrlKey
                || event.altKey
                || event.metaKey
                || event.repeat
                || showSummary
            ) {
                return;
            }

            const target = event.target instanceof HTMLElement ? event.target : null;
            const tagName = target?.tagName;
            if (
                target?.isContentEditable
                || tagName === "INPUT"
                || tagName === "TEXTAREA"
                || tagName === "SELECT"
                || tagName === "BUTTON"
                || tagName === "A"
            ) {
                return;
            }

            event.preventDefault();
            handleAdvanceQuestion();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleAdvanceQuestion, isActive, questions.length, quiz, showSummary]);

    if (!quiz || questions.length === 0) {
        return (
            <EmptyPanel
                title="Quiz"
                message="This lesson does not have valid C-2 quiz content yet."
            />
        );
    }

    const questionNavigator = (
        <div
            ref={questionNavigatorRef}
            onWheel={handleQuestionNavigatorWheel}
            onMouseDown={stopQuestionNavigatorAnimation}
            onTouchStart={stopQuestionNavigatorAnimation}
            onScroll={() => {
                if (navigatorScrollFrameRef.current === null) {
                    navigatorScrollTargetRef.current = questionNavigatorRef.current?.scrollLeft ?? 0;
                }
            }}
            className="flex gap-2 overflow-x-auto overscroll-x-contain overscroll-y-contain pb-5 pt-1 px-0.5"
        >
            {questions.map((question, index) => {
                const isActive = index === currentQuestionIndex;
                const isAnswered = hasAnswer(answers[index]);
                const isCorrect = submitted && isQuestionCorrect(question, index);
                const usedHint = Boolean(hintedQuestions[index]);

                return (
                    <button
                        key={question.id}
                        type="button"
                        ref={isActive ? activeQuestionButtonRef : null}
                        aria-current={isActive ? "step" : undefined}
                        onClick={() => {
                            if (submitted) {
                                openReviewQuestion(index, showSummary ? "push" : "replace");
                                return;
                            }

                            setCurrentQuestionIndex(index);
                            setShowSummary(false);
                            requestQuizView("question", index, "push");
                        }}
                        className={[
                            "flex h-10 w-10 min-w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                            isActive
                                ? "border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950/40"
                                : submitted && isCorrect && usedHint
                                    ? "border-amber-300 bg-amber-50 text-amber-700"
                                    : submitted && isCorrect
                                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                        : submitted
                                            ? "border-rose-300 bg-rose-50 text-rose-700"
                                            : usedHint
                                                ? "border-amber-300 bg-amber-50 text-amber-700"
                                                : isAnswered
                                                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                                    : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                        ].join(" ")}
                        title={
                            submitted
                                ? `Question ${index + 1}: ${isCorrect ? "Correct" : "Needs review"}`
                                : usedHint
                                    ? `Question ${index + 1}: Hint used`
                                    : isAnswered
                                        ? `Question ${index + 1}: Answered`
                                        : `Question ${index + 1}: Unanswered`
                        }
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
            note="Review the quiz regulations before you begin. Starting the quiz also prepares your next lesson in the background."
        >
            <div className="space-y-6">
                {!quizStarted ? (
                    <div className="space-y-5">
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    <ClipboardList className="h-6 w-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                        Before you start
                                    </p>
                                    <h3 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                                        Quiz regulations
                                    </h3>
                                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                        Read these rules before entering the lesson check. Once you
                                        start, the next lesson in your roadmap will also begin
                                        preparing in the background.
                                    </p>
                                </div>
                            </div>

                            {savedAttemptCount > 0 ? (
                                <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                                    Saved best score: <strong>{formatPercent(savedBestScore)}</strong>
                                    {savedQuizState?.lesson_passed
                                        ? " · This lesson has already been passed once, so future retakes can improve your stored best score but will not update radar again."
                                        : ` · Failed attempts saved: ${failedAttempts}.`}
                                </div>
                            ) : null}
                            {savedQuizState?.current_skill_score !== null && savedQuizState?.current_skill_score !== undefined ? (
                                <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
                                    Current {formatLabel(savedQuizState.skill)} radar score:{" "}
                                    <strong>{formatPercent(savedQuizState.current_skill_score)}</strong>
                                </div>
                            ) : null}
                            {quizStateError ? (
                                <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                                    {quizStateError}
                                </div>
                            ) : null}
                            {pendingDraft ? (
                                <div className="mt-4 rounded-3xl border border-blue-200 bg-blue-50 px-4 py-4 dark:border-blue-900 dark:bg-blue-950/30">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                                        Quiz draft found
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                                        Resume from question{" "}
                                        <strong>{Math.min(pendingDraft.currentQuestionIndex + 1, Math.max(1, pendingDraft.questions.length))}</strong>{" "}
                                        of <strong>{pendingDraft.questions.length}</strong>. You already answered{" "}
                                        <strong>
                                            {
                                                Object.values(pendingDraft.answers).filter((value) =>
                                                    hasAnswer(value),
                                                ).length
                                            }
                                        </strong>{" "}
                                        question
                                        {
                                            Object.values(pendingDraft.answers).filter((value) =>
                                                hasAnswer(value),
                                            ).length === 1 ? "" : "s"
                                        }.
                                    </p>
                                </div>
                            ) : null}

                            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40 sm:px-5">
                                <ol className="divide-y divide-slate-200 dark:divide-slate-800">
                                    <li className="flex gap-4 py-3 first:pt-1 last:pb-1">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                                            1
                                        </div>
                                        <p className="pt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                                            <strong className="font-semibold text-slate-950 dark:text-white">
                                                Move one question at a time.
                                            </strong>{" "}
                                            You can move between questions before submission, but
                                            <strong className="font-semibold text-slate-950 dark:text-white">
                                                {" "}scoring is finalized only when you submit.
                                            </strong>
                                        </p>
                                    </li>
                                    <li className="flex gap-4 py-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                                            2
                                        </div>
                                        <p className="pt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                                            <strong className="font-semibold text-slate-950 dark:text-white">
                                                Pass requires a 70% lesson score.
                                            </strong>{" "}
                                            The next lesson can warm up in the background, but it
                                            stays locked until this quiz is passed.
                                        </p>
                                    </li>
                                    <li className="flex gap-4 py-3 first:pt-1 last:pb-1">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                                            3
                                        </div>
                                        <p className="pt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                                            <strong className="font-semibold text-slate-950 dark:text-white">
                                                Hint mode unlocks after 2 failed attempts.
                                            </strong>{" "}
                                            When hint mode is active, "Show hint" fills in the
                                            correct answer and that question is worth{" "}
                                            <strong className="font-semibold text-slate-950 dark:text-white">
                                                0.75 credit
                                            </strong>
                                            .
                                        </p>
                                    </li>
                                    <li className="flex gap-4 py-3 first:pt-1 last:pb-1">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                                            4
                                        </div>
                                        <p className="pt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                                            <strong className="font-semibold text-slate-950 dark:text-white">
                                                Wrong and hinted answers should be reviewed.
                                            </strong>{" "}
                                            If the attempt is failed, the correct answers and explanations for those questions will remain hidden until you pass the quiz.
                                        </p>
                                    </li>
                                </ol>
                            </div>

                            <div className="mt-4 rounded-2xl border-l-4 border-l-sky-500 bg-sky-50 px-4 py-4 dark:bg-sky-950/20">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sky-600 shadow-sm dark:bg-slate-900 dark:text-sky-300">
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
                                            Next lesson warmup
                                        </p>
                                        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                                            {nextLesson
                                                ? `When you click Start quiz, ${nextLesson.lesson.title} from Topic ${nextLesson.topic.sort_order} will be prepared in parallel.`
                                                : "This is the last assigned lesson right now, so no additional lesson needs to be prepared."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                                {pendingDraft ? (
                                    <>
                                        <Button className="w-full sm:w-auto" onClick={handleResumeQuiz}>
                                            Resume quiz
                                        </Button>
                                        <Button
                                            className="w-full sm:w-auto"
                                            variant="outline"
                                            onClick={handleStartOver}
                                        >
                                            Start over
                                        </Button>
                                    </>
                                ) : (
                                    <Button className="w-full sm:w-auto" onClick={handleStartQuiz}>
                                        Start quiz
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}

                {quizStarted ? (
                    <>
                        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-800/60 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
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

                            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 xl:min-w-[420px]">
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
                                        {submitted ? displayedCorrectCount : "?"}
                                    </p>
                                </div>
                                <div className="col-span-2 rounded-2xl bg-white px-4 py-3 sm:col-span-1 dark:bg-slate-900">
                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Hint mode</p>
                                    <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                                        {hintModeUnlocked
                                            ? `Active · ${hintedCount} used`
                                            : `${failedAttempts} / ${HINT_UNLOCK_AFTER_FAILURES}`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {nextLesson ? (
                            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-slate-800 dark:bg-slate-900">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                                        Next lesson warmup
                                    </p>
                                    <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                                        Topic {nextLesson.topic.sort_order} · {nextLesson.lesson.title}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {nextLessonMessage ??
                                            (nextLessonIsReady
                                                ? "Ready to continue when you finish the quiz."
                                                : "Your next lesson will start preparing after you begin the quiz.")}
                                    </p>
                                </div>

                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                    <Badge variant={nextLessonIsReady ? "default" : "secondary"}>
                                        {nextLessonIsReady
                                            ? "Ready"
                                            : nextLessonStatus === "error"
                                                ? "Needs retry"
                                                : "Preparing"}
                                    </Badge>
                                    {nextLessonStatus === "error" ? (
                                        <Button variant="outline" size="sm" onClick={kickoffNextLessonPreparation}>
                                            Retry prep
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}

                        {questionNavigator}

                        {showSummary ? (
                            <section className="space-y-5">
                                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                                            <CheckCircle2 className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                                Quiz complete
                                            </p>
                                            <h3 className="text-2xl font-bold text-slate-950 dark:text-white">
                                                {displayedCorrectCount} / {totalQuestions} correct
                                            </h3>
                                            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                                                Weighted score: {formatPercent(displayedWeightedScorePercent)}
                                                {currentAttemptPassed
                                                    ? " · Passed"
                                                    : lessonPassed
                                                        ? " · Lesson already passed previously"
                                                        : " · Pass requires 70%"}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                        {currentAttemptPassed
                                            ? "You passed this lesson check. Review any question from the navigator above, restart if you want another attempt, or continue once the next lesson is ready."
                                            : lessonPassed
                                                ? "This retake did not pass, but the lesson is already marked as passed. You can review any question, restart again, or continue once the next lesson is ready."
                                                : "Review any question from the navigator above, or restart the quiz to try again."}
                                    </p>
                                    {savedQuizState?.current_skill_score !== null && savedQuizState?.current_skill_score !== undefined ? (
                                        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
                                            Current {formatLabel(savedQuizState.skill)} radar score:{" "}
                                            <strong>{formatPercent(savedQuizState.current_skill_score)}</strong>
                                            {savedQuizState.first_pass_score_percent !== null && savedQuizState.first_pass_score_percent !== undefined
                                                ? ` · First pass recorded at ${formatPercent(savedQuizState.first_pass_score_percent)}.`
                                                : ""}
                                        </div>
                                    ) : null}
                                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Correct without hint</p>
                                            <p className="mt-1 font-semibold text-slate-950 dark:text-white">{displayedCorrectNoHintCount}</p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Correct with hint</p>
                                            <p className="mt-1 font-semibold text-slate-950 dark:text-white">{displayedCorrectWithHintCount}</p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Failed attempts</p>
                                            <p className="mt-1 font-semibold text-slate-950 dark:text-white">{failedAttempts}</p>
                                        </div>
                                    </div>
                                    {!lessonPassed && (
                                        <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                            {nextLesson ? (
                                                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-900 dark:bg-amber-950/40">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                                                        Next lesson lock
                                                    </p>
                                                    <p className="mt-2 text-sm text-amber-900 dark:text-amber-200">
                                                        {nextLessonIsReady
                                                            ? "The next lesson is ready, but it stays locked until you pass this quiz with a weighted score of at least 70%."
                                                            : "The next lesson stays locked until you pass this quiz with a weighted score of at least 70%."}
                                                    </p>
                                                </div>
                                            ) : null}
                                            {failedAttempts + 1 === HINT_UNLOCK_AFTER_FAILURES ? (
                                                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-900 dark:bg-amber-950/40">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                                                        Hint mode
                                                    </p>
                                                    <p className="mt-2 text-sm text-amber-900 dark:text-amber-200">
                                                        One more failed attempt will unlock hint mode for this lesson.
                                                    </p>
                                                </div>
                                            ) : null}
                                            {hintModeUnlocked ? (
                                                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-900 dark:bg-amber-950/40">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                                                        Hint mode
                                                    </p>
                                                    <p className="mt-2 text-sm text-amber-900 dark:text-amber-200">
                                                        Hint mode is now available on your next retry. Each hinted
                                                        answer auto-fills the correct response and counts as{" "}
                                                        {Math.round(HINT_CREDIT * 100)}% credit.
                                                    </p>
                                                </div>
                                            ) : null}
                                        </div>
                                    )}
                                    <div className="mt-5 flex flex-wrap gap-3">
                                        <Button className="w-full sm:w-auto" onClick={handleRestart}>Restart quiz</Button>
                                        <Button
                                            className="w-full sm:w-auto"
                                            variant="outline"
                                            onClick={() => openReviewQuestion(0, "push")}
                                        >
                                            Review from question 1
                                        </Button>
                                        {nextLesson && nextLessonIsReady && lessonPassed ? (
                                            <Button asChild className="w-full sm:w-auto">
                                                <Link
                                                    to="/lessons/$lessonId"
                                                    params={{ lessonId: String(nextLesson.lesson.id) }}
                                                >
                                                    Continue to next lesson
                                                </Link>
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {questions.map((question, index) => {
                                        const isCorrect = isQuestionCorrect(question, index);
                                        return (
                                            <button
                                                key={`summary-${question.id}`}
                                                type="button"
                                                onClick={() => openReviewQuestion(index, "push")}
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
                            <div ref={activeQuestionRef} className="space-y-5">
                                {saveError ? (
                                    <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
                                        {saveError}
                                    </div>
                                ) : null}
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
                                        revealAnswer={currentAttemptPassed}
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
                                        isCorrect={submitted ? isQuestionCorrect(currentQuestion, currentQuestionIndex) : undefined}
                                        explanation={currentQuestion.data[3]}
                                        revealAnswer={currentAttemptPassed}
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
                                        isCorrect={submitted ? isQuestionCorrect(currentQuestion, currentQuestionIndex) : undefined}
                                        explanation={currentQuestion.data[3]}
                                        revealAnswer={currentAttemptPassed}
                                    />
                                )}

                                <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4 sm:px-5 dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                        {submitted
                                            ? currentQuestionHintUsed
                                                ? `Hint applied. This answer counted as ${Math.round(HINT_CREDIT * 100)}% credit.`
                                                : isQuestionCorrect(currentQuestion, currentQuestionIndex)
                                                    ? "Correct. You can move on to the next question."
                                                    : currentAttemptPassed
                                                        ? "Reviewed. You can revise the explanation and continue."
                                                        : "Incorrect. Answers stay hidden on failed attempts. Review the lesson and try again."
                                            : currentQuestionHintUsed
                                                ? `Hint applied. This question will count as ${Math.round(HINT_CREDIT * 100)}% credit when you submit.`
                                                : hintModeUnlocked
                                                    ? "Hint mode is active. Use Show hint only if you need the correct answer filled in."
                                                    : "Move through the quiz with Next. Failed attempts do not reveal the correct answers."
                                        }
                                    </div>

                                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
                                        {!submitted && hintModeUnlocked ? (
                                            <Button
                                                className="w-full border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 sm:w-auto"
                                                variant="outline"
                                                onClick={handleRevealHint}
                                                disabled={currentQuestionHintUsed || savingAttempt}
                                            >
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                {currentQuestionHintUsed ? "Hint applied" : "Show hint"}
                                            </Button>
                                        ) : null}
                                        <Button
                                            className="w-full sm:w-auto"
                                            variant="outline"
                                            onClick={() => {
                                                const nextIndex = Math.max(0, currentQuestionIndex - 1);
                                                if (submitted) {
                                                    openReviewQuestion(nextIndex, "replace");
                                                    return;
                                                }

                                                setCurrentQuestionIndex(nextIndex);
                                                requestQuizView("question", nextIndex, "push");
                                            }}
                                            disabled={currentQuestionIndex === 0 || savingAttempt}
                                        >
                                            <ChevronLeft className="mr-2 h-4 w-4" />
                                            Previous
                                        </Button>

                                        {submitted ? (
                                            <>
                                                {!isLastQuestion ? (
                                                    <Button
                                                        className="w-full sm:w-auto"
                                                        onClick={handleAdvanceQuestion}
                                                    >
                                                        Next
                                                        <ChevronRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                ) : null}
                                                <Button
                                                    className="w-full sm:w-auto"
                                                    onClick={() => {
                                                        const currentMode =
                                                            lessonView?.lessonId === lessonId
                                                                && lessonView.section === "quiz"
                                                                ? lessonView.quizMode
                                                                : undefined;

                                                        if (currentMode === "review") {
                                                            window.history.back();
                                                            return;
                                                        }

                                                        openSummaryView("replace");
                                                    }}
                                                >
                                                    View summary
                                                    <Check className="ml-2 h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : !submitted && isLastQuestion ? (
                                            <Button className="w-full sm:w-auto" onClick={handleSubmitQuiz} disabled={savingAttempt}>
                                                {savingAttempt ? "Saving attempt..." : "Submit quiz"}
                                                <Check className="ml-2 h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                className="w-full sm:w-auto"
                                                onClick={handleAdvanceQuestion}
                                                disabled={savingAttempt}
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
                                            answers will stay hidden unless you pass.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                                        Jump to the first unanswered question to finish faster, or
                                        submit the quiz as-is.
                                    </div>

                                    <AlertDialogFooter className="mt-6">
                                        <AlertDialogCancel>Go back</AlertDialogCancel>
                                        {firstUnansweredQuestionIndex >= 0 ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleGoToFirstUnansweredQuestion}
                                            >
                                                Go to question {firstUnansweredQuestionIndex + 1}
                                            </Button>
                                        ) : null}
                                        <AlertDialogAction onClick={handleConfirmSubmitQuiz} disabled={savingAttempt}>
                                            Submit anyway
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </div>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                ) : null}
            </div>
        </PanelShell>
    );
}

export function LessonPage({ lessonId }: { lessonId: number }) {
    const auth = useAuth();
    const navigate = useNavigate();
    const userId = Number(auth.user?.id);
    const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lessonView, setLessonView] = useState<LessonHistoryView>(
        () => buildLessonHistoryView(lessonId, "scenario"),
    );
    const [trackedStudyMinutesByDay, setTrackedStudyMinutesByDay] = useState<Record<string, number>>(
        () => (Number.isFinite(userId) ? getTrackedStudyMinutesByDay(userId) : {}),
    );
    const [studyGoalDecision, setStudyGoalDecision] = useState<StudyGoalDecision | null>(
        () => (Number.isFinite(userId) ? readStudyGoalDecision(userId, getTodayDateKey()) : null),
    );
    const [showDailyStudyGoalDialog, setShowDailyStudyGoalDialog] = useState(false);
    const [isQuizNavigationGuardActive, setIsQuizNavigationGuardActive] = useState(false);
    const [showQuizLeaveWarning, setShowQuizLeaveWarning] = useState(false);
    const [pendingSectionTarget, setPendingSectionTarget] = useState<SidebarSectionKey | null>(null);
    const [pendingMainNavTarget, setPendingMainNavTarget] = useState<string | null>(null);
    const [pendingNavigationKind, setPendingNavigationKind] = useState<"section" | "roadmap" | "browser" | "main-nav" | null>(null);
    const lessonViewRef = useRef(lessonView);
    const latestQuizViewRef = useRef<LessonHistoryView>(
        buildLessonHistoryView(lessonId, "quiz", "intro"),
    );
    const pendingHistoryDestinationRef = useRef<LessonHistoryView | null>(null);
    const currentLessonUrlRef = useRef("");
    const isQuizNavigationGuardActiveRef = useRef(false);
    const bypassQuizBrowserGuardRef = useRef(false);
    const isSkippingSubmittedQuizHistoryRef = useRef(false);

    const activeSection = lessonView.section;
    const shouldGuardQuizNavigation =
        activeSection === "quiz"
        && lessonView.quizMode === "question"
        && isQuizNavigationGuardActive;

    useEffect(() => {
        const defaultView = buildLessonHistoryView(lessonId, "scenario");
        setLessonView(defaultView);
        lessonViewRef.current = defaultView;
        latestQuizViewRef.current = buildLessonHistoryView(lessonId, "quiz", "intro");
        pendingHistoryDestinationRef.current = null;
        currentLessonUrlRef.current = window.location.href;
        isSkippingSubmittedQuizHistoryRef.current = false;
    }, [lessonId]);

    useEffect(() => {
        lessonViewRef.current = lessonView;
    }, [lessonView]);

    useEffect(() => {
        isQuizNavigationGuardActiveRef.current = isQuizNavigationGuardActive;
    }, [isQuizNavigationGuardActive]);

    useEffect(() => {
        if (!shouldGuardQuizNavigation) {
            setShowQuizLeaveWarning(false);
            setPendingSectionTarget(null);
            setPendingMainNavTarget(null);
            setPendingNavigationKind(null);
            pendingHistoryDestinationRef.current = null;
        }
    }, [shouldGuardQuizNavigation]);

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

    useEffect(() => {
        if (!Number.isFinite(userId)) {
            setProfile(null);
            setTrackedStudyMinutesByDay({});
            setStudyGoalDecision(null);
            return;
        }

        let isMounted = true;

        const loadProfile = async () => {
            try {
                const profileResponse = await fetchCurrentUserProfile();
                if (isMounted) {
                    setProfile(profileResponse);
                }
            } catch {
                if (isMounted) {
                    setProfile(null);
                }
            }
        };

        void loadProfile();
        setTrackedStudyMinutesByDay(getTrackedStudyMinutesByDay(userId));
        setStudyGoalDecision(readStudyGoalDecision(userId, getTodayDateKey()));

        const handleProfileUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<UserProfileResponse>;
            if (isMounted) {
                setProfile(customEvent.detail);
            }
        };

        const handleStudyActivityUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<{
                userId?: number;
                studyMinutesByDay?: Record<string, number>;
            }>;
            if (!isMounted || customEvent.detail.userId !== userId) {
                return;
            }
            setTrackedStudyMinutesByDay(
                customEvent.detail.studyMinutesByDay ?? getTrackedStudyMinutesByDay(userId),
            );
        };

        window.addEventListener("careerpath:profile-updated", handleProfileUpdated);
        window.addEventListener(
            "careerpath:study-activity-updated",
            handleStudyActivityUpdated,
        );

        return () => {
            isMounted = false;
            window.removeEventListener("careerpath:profile-updated", handleProfileUpdated);
            window.removeEventListener(
                "careerpath:study-activity-updated",
                handleStudyActivityUpdated,
            );
        };
    }, [userId]);

    const lessonLookup = useMemo(
        () => (Number.isNaN(lessonId) ? null : findLesson(roadmap, lessonId)),
        [lessonId, roadmap],
    );
    const nextLessonLookup = useMemo(
        () => (Number.isNaN(lessonId) ? null : findNextLesson(roadmap, lessonId)),
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
    const todayDateKey = getTodayDateKey();
    const backendStudiedTodayMinutes = getStudyMinutesForDate(
        profile?.study_history,
        todayDateKey,
    );
    const trackedStudiedTodayMinutes = trackedStudyMinutesByDay[todayDateKey] ?? 0;
    const todayLearnedMinutes = backendStudiedTodayMinutes + trackedStudiedTodayMinutes;
    const dailyStudyMinutes = profile?.daily_study_minutes ?? 0;
    const quizHistorySourceQuestions = useMemo(
        () => buildEmbeddedQuizQuestions(quiz),
        [quiz],
    );

    const normalizeLessonView = useCallback(
        (view: LessonHistoryView) =>
            buildLessonHistoryView(
                view.lessonId,
                view.section,
                view.quizMode,
                view.questionIndex,
            ),
        [],
    );

    const resolveSavedQuizView = useCallback(() => {
        if (!Number.isFinite(userId) || quizHistorySourceQuestions.length === 0) {
            return buildLessonHistoryView(lessonId, "quiz", "intro");
        }

        const completedSnapshot = readEmbeddedLessonQuizCompletedSnapshot(userId, lessonId);
        if (
            completedSnapshot
            && isEmbeddedLessonQuizCompletedSnapshotCompatible(
                completedSnapshot,
                lessonId,
                quizHistorySourceQuestions,
            )
        ) {
            return buildLessonHistoryView(
                lessonId,
                "quiz",
                completedSnapshot.showSummary ? "summary" : "review",
                completedSnapshot.showSummary
                    ? null
                    : completedSnapshot.currentQuestionIndex,
            );
        }

        const savedDraft = readEmbeddedLessonQuizDraft(userId, lessonId);
        if (
            savedDraft
            && isEmbeddedLessonQuizDraftCompatible(
                savedDraft,
                lessonId,
                quizHistorySourceQuestions,
            )
        ) {
            return buildLessonHistoryView(
                lessonId,
                "quiz",
                "question",
                savedDraft.currentQuestionIndex,
            );
        }

        return buildLessonHistoryView(lessonId, "quiz", "intro");
    }, [lessonId, quizHistorySourceQuestions, userId]);

    const navigateLessonView = useCallback((
        nextView: LessonHistoryView,
        historyMode: "push" | "replace" = "push",
    ) => {
        const normalized = normalizeLessonView(nextView);
        const nextState = {
            ...stripLegacyLessonHistoryState(readBrowserHistoryState()),
            lessonView: normalized,
        };
        const nextUrl = currentLessonUrlRef.current || window.location.href;

        if (historyMode === "replace") {
            window.history.replaceState(nextState, "", nextUrl);
        } else {
            window.history.pushState(nextState, "", nextUrl);
        }

        lessonViewRef.current = normalized;
        if (normalized.section === "quiz") {
            latestQuizViewRef.current = normalized;
        }
        setLessonView(normalized);
    }, [normalizeLessonView]);

    const handleLessonViewRequest = useCallback((
        nextView: LessonHistoryView,
        historyMode: "push" | "replace" = "replace",
    ) => {
        navigateLessonView(nextView, historyMode);
    }, [navigateLessonView]);

    const handleQuizViewStateChange = useCallback((view: LessonHistoryView) => {
        latestQuizViewRef.current = normalizeLessonView(view);
    }, [normalizeLessonView]);

    const resolveQuizSectionView = useCallback(() => {
        const currentView = lessonViewRef.current;
        if (currentView.lessonId === lessonId && currentView.section === "quiz") {
            return currentView;
        }

        const latestQuizView = latestQuizViewRef.current;
        if (
            latestQuizView.lessonId === lessonId
            && latestQuizView.section === "quiz"
            && latestQuizView.quizMode
            && latestQuizView.quizMode !== "intro"
        ) {
            return latestQuizView;
        }

        return resolveSavedQuizView();
    }, [lessonId, resolveSavedQuizView]);

    useEffect(() => {
        if (
            !Number.isFinite(userId)
            || dailyStudyMinutes <= 0
            || studyGoalDecision !== null
        ) {
            setShowDailyStudyGoalDialog(false);
            return;
        }

        if (todayLearnedMinutes >= dailyStudyMinutes) {
            setShowDailyStudyGoalDialog(true);
        }
    }, [dailyStudyMinutes, studyGoalDecision, todayLearnedMinutes, userId]);

    useEffect(() => {
        if (
            !Number.isFinite(userId)
            || loading
            || error
            || !lessonLookup
            || !lessonLookup.lesson.is_generated
            || !lessonLookup.lesson.is_unlocked
        ) {
            return;
        }

        let activeSince =
            document.visibilityState === "visible" && document.hasFocus()
                ? Date.now()
                : null;

        const flushStudyTime = () => {
            if (activeSince === null) {
                return;
            }

            const elapsedMilliseconds = Date.now() - activeSince;
            activeSince = Date.now();

            if (elapsedMilliseconds > 0) {
                recordStudyTime(userId, elapsedMilliseconds);
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                flushStudyTime();
                activeSince = null;
                return;
            }

            if (document.hasFocus()) {
                activeSince = Date.now();
            }
        };

        const handleWindowBlur = () => {
            flushStudyTime();
            activeSince = null;
        };

        const handleWindowFocus = () => {
            if (document.visibilityState === "visible") {
                activeSince = Date.now();
            }
        };

        const intervalId = window.setInterval(() => {
            flushStudyTime();
        }, 15_000);

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleWindowBlur);
        window.addEventListener("focus", handleWindowFocus);
        window.addEventListener("beforeunload", flushStudyTime);

        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleWindowBlur);
            window.removeEventListener("focus", handleWindowFocus);
            window.removeEventListener("beforeunload", flushStudyTime);
            flushStudyTime();
        };
    }, [error, lessonLookup, loading, userId]);

    useEffect(() => {
        if (
            !lessonLookup
            || !lessonLookup.lesson.is_generated
            || !lessonLookup.lesson.is_unlocked
        ) {
            return;
        }

        currentLessonUrlRef.current = window.location.href;
        const currentHistoryView = readLessonHistoryViewFromState(
            readBrowserHistoryState(),
        );
        const savedQuizView = resolveSavedQuizView();
        latestQuizViewRef.current = savedQuizView;

        const nextView =
            currentHistoryView?.lessonId === lessonId
                ? normalizeLessonView(currentHistoryView)
                : savedQuizView.quizMode && savedQuizView.quizMode !== "intro"
                    ? savedQuizView
                    : buildLessonHistoryView(lessonId, "scenario");

        navigateLessonView(nextView, "replace");
    }, [
        lessonId,
        lessonLookup,
        navigateLessonView,
        normalizeLessonView,
        resolveSavedQuizView,
    ]);

    useEffect(() => {
        const handlePopState = () => {
            const nextHistoryState = readBrowserHistoryState();
            const nextHistoryView = readLessonHistoryViewFromState(nextHistoryState);
            const nextView =
                nextHistoryView?.lessonId === lessonId
                    ? normalizeLessonView(nextHistoryView)
                    : null;
            const currentView = lessonViewRef.current;

            const shouldSkipSubmittedQuizHistory =
                currentView.lessonId === lessonId
                && currentView.section === "quiz"
                && (
                    currentView.quizMode === "summary"
                    || currentView.quizMode === "review"
                )
                && nextView?.lessonId === lessonId
                && nextView.section === "quiz"
                && (
                    nextView.quizMode === "intro"
                    || nextView.quizMode === "question"
                );

            if (shouldSkipSubmittedQuizHistory) {
                isSkippingSubmittedQuizHistoryRef.current = true;
                window.history.back();
                return;
            }

            if (isSkippingSubmittedQuizHistoryRef.current) {
                isSkippingSubmittedQuizHistoryRef.current = false;
            }

            if (bypassQuizBrowserGuardRef.current) {
                bypassQuizBrowserGuardRef.current = false;
                if (nextView) {
                    lessonViewRef.current = nextView;
                    if (nextView.section === "quiz") {
                        latestQuizViewRef.current = nextView;
                    }
                    setLessonView(nextView);
                }
                return;
            }

            const shouldBlockBrowserExit =
                isQuizNavigationGuardActiveRef.current
                && currentView.lessonId === lessonId
                && currentView.section === "quiz"
                && currentView.quizMode === "question"
                && (
                    !nextView
                    || nextView.section !== "quiz"
                    || nextView.quizMode !== "question"
                );

            if (shouldBlockBrowserExit) {
                pendingHistoryDestinationRef.current = nextView;
                window.history.pushState(
                    {
                        ...stripLegacyLessonHistoryState(nextHistoryState),
                        lessonView: currentView,
                    },
                    "",
                    currentLessonUrlRef.current || window.location.href,
                );
                setPendingSectionTarget(null);
                setPendingMainNavTarget(null);
                setPendingNavigationKind("browser");
                setShowQuizLeaveWarning(true);
                return;
            }

            pendingHistoryDestinationRef.current = null;
            if (!nextView) {
                return;
            }

            lessonViewRef.current = nextView;
            if (nextView.section === "quiz") {
                latestQuizViewRef.current = nextView;
            }
            setLessonView(nextView);
        };

        window.addEventListener("popstate", handlePopState);
        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [lessonId, normalizeLessonView]);

    useEffect(() => {
        if (!shouldGuardQuizNavigation) {
            return;
        }

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [shouldGuardQuizNavigation]);

    const handleSectionChange = useCallback((sectionKey: SidebarSectionKey) => {
        if (shouldGuardQuizNavigation && sectionKey !== "quiz") {
            setPendingSectionTarget(sectionKey);
            setPendingMainNavTarget(null);
            setPendingNavigationKind("section");
            setShowQuizLeaveWarning(true);
            return;
        }

        const nextView =
            sectionKey === "quiz"
                ? resolveQuizSectionView()
                : buildLessonHistoryView(lessonId, sectionKey);

        if (areLessonHistoryViewsEqual(lessonViewRef.current, nextView)) {
            return;
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
        navigateLessonView(nextView, "push");
    }, [lessonId, navigateLessonView, resolveQuizSectionView, shouldGuardQuizNavigation]);

    const handleBackToRoadmap = useCallback(() => {
        if (shouldGuardQuizNavigation) {
            setPendingSectionTarget(null);
            setPendingMainNavTarget(null);
            setPendingNavigationKind("roadmap");
            setShowQuizLeaveWarning(true);
            return;
        }

        void navigate({ to: "/lessons/learning-path" });
    }, [navigate, shouldGuardQuizNavigation]);

    const handleMainNavigationIntent = useCallback((to: string) => {
        if (!shouldGuardQuizNavigation) {
            return false;
        }

        setPendingSectionTarget(null);
        setPendingMainNavTarget(to);
        setPendingNavigationKind("main-nav");
        setShowQuizLeaveWarning(true);
        return true;
    }, [shouldGuardQuizNavigation]);

    const handleCancelQuizLeave = useCallback(() => {
        setShowQuizLeaveWarning(false);
        setPendingSectionTarget(null);
        setPendingMainNavTarget(null);
        setPendingNavigationKind(null);
        pendingHistoryDestinationRef.current = null;
    }, []);

    const handleConfirmQuizLeave = useCallback(() => {
        const pendingSection = pendingSectionTarget;
        const pendingMainNav = pendingMainNavTarget;
        const navigationKind = pendingNavigationKind;
        const pendingHistoryDestination = pendingHistoryDestinationRef.current;

        setShowQuizLeaveWarning(false);
        setPendingSectionTarget(null);
        setPendingMainNavTarget(null);
        setPendingNavigationKind(null);
        pendingHistoryDestinationRef.current = null;

        if (navigationKind === "section" && pendingSection) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            navigateLessonView(
                buildLessonHistoryView(lessonId, pendingSection),
                "push",
            );
            return;
        }

        if (navigationKind === "roadmap") {
            void navigate({ to: "/lessons/learning-path" });
            return;
        }

        if (navigationKind === "main-nav" && pendingMainNav) {
            void navigate({ to: pendingMainNav });
            return;
        }

        if (navigationKind === "browser") {
            if (pendingHistoryDestination) {
                if (pendingHistoryDestination.section !== "quiz") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
                navigateLessonView(pendingHistoryDestination, "replace");
                return;
            }
            bypassQuizBrowserGuardRef.current = true;
            window.history.back();
        }
    }, [
        lessonId,
        navigate,
        navigateLessonView,
        pendingMainNavTarget,
        pendingNavigationKind,
        pendingSectionTarget,
    ]);

    const handleTakeBreakAfterGoal = () => {
        if (Number.isFinite(userId)) {
            writeStudyGoalDecision(userId, "break", todayDateKey);
        }
        setStudyGoalDecision("break");
        setShowDailyStudyGoalDialog(false);
    };

    const handleKeepLearningAfterGoal = () => {
        if (Number.isFinite(userId)) {
            writeStudyGoalDecision(userId, "continue", todayDateKey);
        }
        setStudyGoalDecision("continue");
        setShowDailyStudyGoalDialog(false);
    };

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

    if (!lesson.is_unlocked) {
        return (
            <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
                <MainNavigationMenu />
                <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-lg font-semibold text-slate-950 dark:text-white">
                            Lesson is locked
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Pass the previous lesson in this topic to unlock this lesson.
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
            <DailyStudyGoalDialog
                open={showDailyStudyGoalDialog}
                plannedMinutes={dailyStudyMinutes}
                learnedMinutes={todayLearnedMinutes}
                onTakeBreak={handleTakeBreakAfterGoal}
                onKeepLearning={handleKeepLearningAfterGoal}
            />
            <MainNavigationMenu
                onNavigateIntent={handleMainNavigationIntent}
                disableStudySettings={shouldGuardQuizNavigation}
            />

            <main className="mx-auto max-w-[1480px] px-3 py-4 sm:px-6 sm:py-6 xl:px-8">
                <header className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center gap-3">
                        <Button variant="outline" size="sm" onClick={handleBackToRoadmap}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to roadmap
                        </Button>
                        <Badge variant="secondary" className="capitalize">
                            {track} track
                        </Badge>
                        <Badge variant="outline">{formatLabel(topic.primary_skill)}</Badge>
                        <Badge variant="outline">{formatLabel(lesson.difficulty_tier)}</Badge>
                    </div>

                    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                                Topic {topic.sort_order} · {topic.name}
                            </p>
                            <h1 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                                {lesson.title}
                            </h1>
                            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                                This page renders the stored C-1 theory and C-2 quiz content for
                                your selected lesson directly from the database-backed roadmap.
                            </p>
                        </div>

                        <div className="grid gap-3 rounded-3xl bg-slate-50 p-4 sm:p-5 dark:bg-slate-800/60">
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
                        <div className="rounded-[28px] border border-slate-200 bg-white p-3 sm:p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-4 px-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                    Lesson map
                                </p>
                                <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                                    8 sections
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-col">
                                {SECTION_META.map((meta) => (
                                    <div key={meta.key} className="min-w-0">
                                        <SectionButton
                                            meta={meta}
                                            isActive={meta.key === activeSection}
                                            onClick={() => handleSectionChange(meta.key)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>

                    <div className="min-w-0">
                        <div className={activeSection === "quiz" ? "block" : "hidden"}>
                            <EmbeddedLessonQuiz
                                key={lesson.id}
                                lessonId={lesson.id}
                                quiz={quiz}
                                nextLesson={nextLessonLookup}
                                isActive={activeSection === "quiz"}
                                lessonView={lessonView}
                                onLessonViewRequest={handleLessonViewRequest}
                                onQuizViewStateChange={handleQuizViewStateChange}
                                onNavigationGuardChange={setIsQuizNavigationGuardActive}
                            />
                        </div>

                        {activeSection !== "quiz" ? (
                            activeTheorySection ? (
                                renderTheorySection(activeTheorySection)
                            ) : (
                                <EmptyPanel
                                    title="Section unavailable"
                                    message="This section is missing or malformed in the stored lesson payload."
                                />
                            )
                        ) : null}
                    </div>
                </div>
            </main>

            <AlertDialog
                open={showQuizLeaveWarning}
                onOpenChange={(open) => {
                    if (!open) {
                        handleCancelQuizLeave();
                    }
                }}
            >
                <AlertDialogContent className="rounded-3xl border-slate-200 p-0 shadow-2xl dark:border-slate-800">
                    <div className="p-6 sm:p-7">
                        <AlertDialogHeader className="text-left">
                            <AlertDialogTitle className="text-xl font-bold text-slate-950 dark:text-white">
                                Leave quiz in progress?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="pt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                Your quiz attempt is still in progress. If you leave this quiz tab,
                                a warning is shown so you do not move away by accident.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                            You can stay in the quiz and continue answering, or leave and come
                            back later to resume from your saved draft.
                        </div>

                        <AlertDialogFooter className="mt-6">
                            <AlertDialogCancel onClick={handleCancelQuizLeave}>
                                Stay in quiz
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmQuizLeave}>
                                Leave quiz
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
