import type { LucideIcon } from "lucide-react";
import type {
    LessonQuizSubmitResponse,
    RoadmapLesson,
    RoadmapTopic,
} from "@/feature/learning-path/api/roadmapApi";
import type {
    FillBlankQuestionData,
    MultiSelectQuestionData,
    OrderingQuestionData,
} from "@/feature/quiz-engine/type/Quiz";

export type TheorySectionKey =
    | "scenario"
    | "vocab"
    | "phrases"
    | "reading"
    | "dialogue"
    | "listening"
    | "wrapup";

export type SidebarSectionKey = TheorySectionKey | "quiz";

export type QuizRow = [string, string, string, string];

export type SectionMeta = {
    key: SidebarSectionKey;
    label: string;
    eyebrow: string;
    icon: LucideIcon;
};

export type ParsedTheorySection = {
    key: TheorySectionKey;
    label: string;
    primary: any;
    secondary: string;
    note: string;
    raw?: any;
    schemaVersion?: number;
};

export type ParsedQuiz = {
    fillBlank: QuizRow[];
    multiSelect: QuizRow[];
    ordering: QuizRow[];
};

export type LessonLookup = {
    track: string;
    topic: RoadmapTopic;
    lesson: RoadmapLesson;
};

export type EmbeddedQuestionType = "fill_blank" | "multi_select" | "ordering";

export type EmbeddedQuizQuestion = {
    id: string;
    type: EmbeddedQuestionType;
    data: FillBlankQuestionData | MultiSelectQuestionData | OrderingQuestionData;
    canonicalAnswer?: string;
    displayAnswer?: string;
    displayToCanonicalIndex?: number[];
    canonicalToDisplayIndex?: number[];
};

export type EmbeddedLessonQuizDraft = {
    version: number;
    lessonId: number;
    quizStarted: boolean;
    currentQuestionIndex: number;
    answers: Record<number, string>;
    hintedQuestions: Record<number, boolean>;
    questions: EmbeddedQuizQuestion[];
};

export type EmbeddedLessonQuizCompletedSnapshot = {
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

export type BrowserHistoryState = Record<string, unknown>;
export type LessonQuizMode = "intro" | "question" | "summary" | "review";
export type LessonHistoryView = {
    lessonId: number;
    section: SidebarSectionKey;
    quizMode?: LessonQuizMode;
    questionIndex?: number | null;
};
