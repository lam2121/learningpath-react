import type {
    LessonQuizStateResponse,
    LessonQuizSubmitResponse,
} from "@/feature/learning-path/api/roadmapApi";
import type {
    FillBlankQuestionData,
    MultiSelectQuestionData,
    OrderingQuestionData,
} from "@/feature/quiz-engine/type/Quiz";
import type {
    EmbeddedLessonQuizCompletedSnapshot,
    EmbeddedLessonQuizDraft,
    EmbeddedQuizQuestion,
    ParsedQuiz,
    QuizRow,
} from "../type/lessonWorkspace";

export const HINT_UNLOCK_AFTER_FAILURES = 2;
export const HINT_CREDIT = 0.75;
export const EMBEDDED_LESSON_QUIZ_DRAFT_VERSION = 2;
export const EMBEDDED_LESSON_QUIZ_COMPLETED_VERSION = 2;

export function getEmbeddedLessonQuizDraftStorageKey(userId: number, lessonId: number) {
    return `learning-embedded-quiz-draft:${userId}:${lessonId}`;
}

export function getEmbeddedLessonQuizCompletedStorageKey(userId: number, lessonId: number) {
    return `learning-embedded-quiz-completed:${userId}:${lessonId}`;
}

export function isEmbeddedQuizQuestion(value: unknown): value is EmbeddedQuizQuestion {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const question = value as Record<string, unknown>;
    return (
        typeof question.id === "string" &&
        (question.type === "fill_blank" ||
            question.type === "multi_select" ||
            question.type === "ordering") &&
        Array.isArray(question.data)
    );
}

export function isEmbeddedLessonQuizDraft(value: unknown): value is EmbeddedLessonQuizDraft {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const draft = value as Record<string, unknown>;
    return (
        typeof draft.version === "number" &&
        typeof draft.lessonId === "number" &&
        typeof draft.quizStarted === "boolean" &&
        typeof draft.currentQuestionIndex === "number" &&
        draft.answers !== null &&
        typeof draft.answers === "object" &&
        !Array.isArray(draft.answers) &&
        draft.hintedQuestions !== null &&
        typeof draft.hintedQuestions === "object" &&
        !Array.isArray(draft.hintedQuestions) &&
        Array.isArray(draft.questions) &&
        draft.questions.every(isEmbeddedQuizQuestion)
    );
}

export function isLessonQuizSubmitResponseLike(value: unknown): value is LessonQuizSubmitResponse {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const response = value as Record<string, unknown>;
    return (
        typeof response.lesson_id === "number" &&
        typeof response.skill === "string" &&
        typeof response.status === "string" &&
        typeof response.lesson_passed === "boolean" &&
        typeof response.best_score_percent === "number" &&
        typeof response.attempt_count === "number" &&
        typeof response.failed_attempts === "number" &&
        (response.completed_at === null || typeof response.completed_at === "string") &&
        (response.current_skill_score === null || typeof response.current_skill_score === "number") &&
        (response.first_pass_score_percent === null || typeof response.first_pass_score_percent === "number") &&
        typeof response.current_attempt_passed === "boolean" &&
        typeof response.weighted_score_percent === "number" &&
        typeof response.correct_no_hint_count === "number" &&
        typeof response.correct_with_hint_count === "number" &&
        typeof response.total_questions === "number" &&
        typeof response.first_pass_radar_applied === "boolean" &&
        typeof response.current_attempt_is_new_best === "boolean" &&
        Array.isArray(response.question_results)
    );
}

export function isEmbeddedLessonQuizCompletedSnapshot(
    value: unknown,
): value is EmbeddedLessonQuizCompletedSnapshot {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const snapshot = value as Record<string, unknown>;
    return (
        typeof snapshot.version === "number" &&
        typeof snapshot.lessonId === "number" &&
        typeof snapshot.showSummary === "boolean" &&
        typeof snapshot.currentQuestionIndex === "number" &&
        snapshot.answers !== null &&
        typeof snapshot.answers === "object" &&
        !Array.isArray(snapshot.answers) &&
        snapshot.hintedQuestions !== null &&
        typeof snapshot.hintedQuestions === "object" &&
        !Array.isArray(snapshot.hintedQuestions) &&
        Array.isArray(snapshot.questions) &&
        snapshot.questions.every(isEmbeddedQuizQuestion) &&
        isLessonQuizSubmitResponseLike(snapshot.lastSubmittedResult) &&
        (snapshot.nextLessonStatus === "idle" ||
            snapshot.nextLessonStatus === "preparing" ||
            snapshot.nextLessonStatus === "ready" ||
            snapshot.nextLessonStatus === "error") &&
        (snapshot.nextLessonMessage === null || typeof snapshot.nextLessonMessage === "string")
    );
}

export function readEmbeddedLessonQuizDraft(
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

export function writeEmbeddedLessonQuizDraft(
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

export function readEmbeddedLessonQuizCompletedSnapshot(
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

export function writeEmbeddedLessonQuizCompletedSnapshot(
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

export function clearEmbeddedLessonQuizDraft(userId: number, lessonId: number) {
    try {
        localStorage.removeItem(
            getEmbeddedLessonQuizDraftStorageKey(userId, lessonId),
        );
    } catch {
        // Ignore storage errors and keep the quiz usable.
    }
}

export function clearEmbeddedLessonQuizCompletedSnapshot(userId: number, lessonId: number) {
    try {
        localStorage.removeItem(
            getEmbeddedLessonQuizCompletedStorageKey(userId, lessonId),
        );
    } catch {
        // Ignore storage errors and keep the quiz usable.
    }
}

export function isEmbeddedLessonQuizDraftCompatible(
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

export function isEmbeddedLessonQuizCompletedSnapshotCompatible(
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

export function buildSavedQuizStateFromSubmission(
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

export function shuffleQuestions<T>(items: T[]) {
    const next = [...items];
    for (let index = next.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    }
    return next;
}

export function shuffleOptionEntries<T>(items: T[]) {
    const next = [...items];
    for (let index = next.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    }
    return next;
}

export function shuffleFillBlankRow(row: QuizRow): QuizRow {
    const [stem, optionsStr, correctAnswer, explanation] = row;
    const shuffledOptions = shuffleOptionEntries(optionsStr.split("|"));

    return [stem, shuffledOptions.join("|"), correctAnswer, explanation];
}

export function normalizeIndexAnswer(answer: string) {
    return answer
        .split("|")
        .map((part) => Number(part.trim()))
        .filter((value) => !Number.isNaN(value))
        .sort((a, b) => a - b)
        .join("|");
}

export function shuffleMultiSelectRow(row: QuizRow): {
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

export function buildEmbeddedQuizQuestions(quiz: ParsedQuiz | null): EmbeddedQuizQuestion[] {
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

export function hasAnswer(answer: string | undefined): answer is string {
    return Boolean(answer && answer.trim().length > 0);
}

export function canonicalToDisplayAnswer(
    question: EmbeddedQuizQuestion,
    canonicalAnswer: string,
): string {
    if (question.type !== "multi_select" || !question.canonicalToDisplayIndex?.length) {
        return canonicalAnswer;
    }
    return canonicalAnswer
        .split("|")
        .map((part) => Number(part.trim()))
        .filter((value) => !Number.isNaN(value))
        .map((canonicalIndex) => question.canonicalToDisplayIndex?.[canonicalIndex])
        .filter((value): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0)
        .sort((left, right) => left - right)
        .join("|");
}

export function getEmbeddedDisplayAnswer(question: EmbeddedQuizQuestion) {
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

export function isEmbeddedAnswerCorrect(question: EmbeddedQuizQuestion, answer: string | undefined) {
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

export function getEmbeddedCorrectAnswer(question: EmbeddedQuizQuestion) {
    return getEmbeddedDisplayAnswer(question);
}

export function getCanonicalSubmittedAnswer(
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
