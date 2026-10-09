import type { RoadmapResponse } from "@/feature/learning-path/api/roadmapApi";
import type {
    BrowserHistoryState,
    LessonHistoryView,
    LessonLookup,
    LessonQuizMode,
    SidebarSectionKey,
} from "../type/lessonWorkspace";

export function readBrowserHistoryState(): BrowserHistoryState {
    return window.history.state && typeof window.history.state === "object"
        ? (window.history.state as BrowserHistoryState)
        : {};
}

export function stripLessonQuizGuardState(state: BrowserHistoryState): BrowserHistoryState {
    const nextState = { ...state };
    delete nextState.lessonQuizGuard;
    return nextState;
}

export function stripEmbeddedLessonQuizViewState(state: BrowserHistoryState): BrowserHistoryState {
    const nextState = { ...state };
    delete nextState.embeddedLessonQuizView;
    return nextState;
}

export function stripLegacyLessonHistoryState(state: BrowserHistoryState): BrowserHistoryState {
    return stripEmbeddedLessonQuizViewState(stripLessonQuizGuardState(state));
}

export function isSidebarSectionKey(value: unknown): value is SidebarSectionKey {
    return (
        value === "scenario" ||
        value === "vocab" ||
        value === "phrases" ||
        value === "reading" ||
        value === "dialogue" ||
        value === "listening" ||
        value === "wrapup" ||
        value === "process" ||
        value === "dos_donts" ||
        value === "quiz"
    );
}

export function isLessonQuizMode(value: unknown): value is LessonQuizMode {
    return (
        value === "intro" ||
        value === "question" ||
        value === "summary" ||
        value === "review"
    );
}

export function buildLessonHistoryView(
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

export function readLessonHistoryViewFromState(
    state: BrowserHistoryState,
): LessonHistoryView | null {
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

export function areLessonHistoryViewsEqual(
    left: LessonHistoryView | null,
    right: LessonHistoryView | null,
) {
    if (left === right) {
        return true;
    }

    if (!left || !right) {
        return false;
    }

    return (
        left.lessonId === right.lessonId &&
        left.section === right.section &&
        left.quizMode === right.quizMode &&
        (left.questionIndex ?? null) === (right.questionIndex ?? null)
    );
}

export function readEmbeddedLessonQuizViewFromHistoryState(state: BrowserHistoryState) {
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

export function findLesson(
    roadmap: RoadmapResponse | null,
    lessonId: number,
): LessonLookup | null {
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

export function findNextLesson(
    roadmap: RoadmapResponse | null,
    lessonId: number,
): LessonLookup | null {
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
