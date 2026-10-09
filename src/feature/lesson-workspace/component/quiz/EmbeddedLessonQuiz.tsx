import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type WheelEvent as ReactWheelEvent,
} from "react";
import {
    Check,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Sparkles,
} from "lucide-react";
import { useAuth } from "@/common/context/AuthContext";
import { fetchCurrentUserProfile } from "@/feature/auth/api/authAPI";
import {
    buildRoadmapNotificationStreamUrl,
    fetchLessonQuizHint,
    fetchLessonQuizState,
    fetchRoadmap,
    kickoffRoadmapLessonGeneration,
    submitLessonQuiz,
    type LessonQuizStateResponse,
    type LessonQuizSubmitResponse,
} from "@/feature/learning-path/api/roadmapApi";
import { useRadar } from "@/feature/radar";
import { Badge } from "@/shadcn/component/ui/badge";
import { Button } from "@/shadcn/component/ui/button";
import { QuizRegulationsCard } from "./QuizRegulationsCard";
import { QuizQuestionNavigator } from "./QuizQuestionNavigator";
import { QuizSummaryView } from "./QuizSummaryView";
import { QuizIncompleteWarningDialog } from "./QuizIncompleteWarningDialog";
import { Progress } from "@/shadcn/component/ui/progress";
import { FillBlankQuestion } from "@/feature/quiz-engine/component/FillBlankQuestion";
import { MultiSelectQuestion } from "@/feature/quiz-engine/component/MultiSelectQuestion";
import { OrderingQuestion } from "@/feature/quiz-engine/component/OrderingQuestion";
import type {
    FillBlankQuestionData,
    MultiSelectQuestionData,
    OrderingQuestionData,
} from "@/feature/quiz-engine/type/Quiz";
import { useLessonLanguage } from "@/feature/lesson-workspace/context/LessonLanguageContext";
import type {
    EmbeddedLessonQuizDraft,
    EmbeddedQuizQuestion,
    LessonHistoryView,
    LessonLookup,
    LessonQuizMode,
    ParsedQuiz,
} from "@/feature/lesson-workspace/type/lessonWorkspace";
import {
    EMBEDDED_LESSON_QUIZ_COMPLETED_VERSION,
    EMBEDDED_LESSON_QUIZ_DRAFT_VERSION,
    HINT_CREDIT,
    HINT_UNLOCK_AFTER_FAILURES,
    buildEmbeddedQuizQuestions,
    buildSavedQuizStateFromSubmission,
    canonicalToDisplayAnswer,
    clearEmbeddedLessonQuizCompletedSnapshot,
    clearEmbeddedLessonQuizDraft,
    getCanonicalSubmittedAnswer,
    hasAnswer,
    isEmbeddedAnswerCorrect,
    isEmbeddedLessonQuizCompletedSnapshotCompatible,
    isEmbeddedLessonQuizDraftCompatible,
    readEmbeddedLessonQuizCompletedSnapshot,
    readEmbeddedLessonQuizDraft,
    shuffleQuestions,
    writeEmbeddedLessonQuizCompletedSnapshot,
    writeEmbeddedLessonQuizDraft,
} from "@/feature/lesson-workspace/util/embeddedQuizPersistence";
import {
    getSectionEyebrowNumber,
    getSectionTitle,
} from "@/feature/lesson-workspace/util/lessonFormatters";
import { buildLessonHistoryView, findLesson } from "@/feature/lesson-workspace/util/lessonNavigation";
import { isLessonGenerated } from "@/feature/learning-path/lessonAccess";
import { EmptyPanel, PanelShell } from "../shared";

export function EmbeddedLessonQuiz({
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
    const { language } = useLessonLanguage();
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
    const [isFetchingHint, setIsFetchingHint] = useState(false);
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
        setIsFetchingHint(false);
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
        setNextLessonStatus(isLessonGenerated(nextLesson?.lesson) ? "ready" : "idle");
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
            || isLessonGenerated(nextLesson.lesson)
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
                if (updatedNextLesson && isLessonGenerated(updatedNextLesson.lesson)) {
                    setNextLessonStatus("ready");
                    setNextLessonMessage(
                        `${updatedNextLesson.lesson.title} is ready for you to continue immediately after the quiz.`,
                    );
                }
            } catch {
                // Keep the warmup status as-is; the user can still finish the quiz.
            }
        };

        // Check initially once
        void checkNextLesson();

        // Replace 15s polling with SSE-driven event listener
        let stream: EventSource | null = null;
        try {
            stream = new EventSource(buildRoadmapNotificationStreamUrl(), {
                withCredentials: true,
            });

            stream.addEventListener("roadmap_updated", (event: MessageEvent) => {
                try {
                    const data = JSON.parse(event.data);
                    if (!data?.lesson_id || data.lesson_id === nextLesson.lesson.id) {
                        void checkNextLesson();
                    }
                } catch {
                    void checkNextLesson();
                }
            });
        } catch {
            // If SSE cannot connect, rely on initial check
        }

        return () => {
            cancelled = true;
            stream?.close();
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
    const nextLessonIsReady = nextLessonStatus === "ready" || isLessonGenerated(nextLesson?.lesson);
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

        if (isLessonGenerated(nextLesson.lesson)) {
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
        setNextLessonStatus(isLessonGenerated(nextLesson?.lesson) ? "ready" : "idle");
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
        setNextLessonStatus(isLessonGenerated(nextLesson?.lesson) ? "ready" : "idle");
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

    const handleRevealHint = async () => {
        if (submitted || !hintModeUnlocked || isFetchingHint || !currentQuestion) {
            return;
        }

        setIsFetchingHint(true);
        setSaveError(null);
        try {
            const hintResponse = await fetchLessonQuizHint(lessonId, currentQuestion.id);
            const displayAnswer = currentQuestion.type === "multi_select"
                ? canonicalToDisplayAnswer(currentQuestion, hintResponse.correct_answer)
                : hintResponse.correct_answer;

            setHintedQuestions((prev) => ({ ...prev, [currentQuestionIndex]: true }));
            setAnswers((prev) => ({
                ...prev,
                [currentQuestionIndex]: displayAnswer,
            }));
        } catch (hintError) {
            setSaveError(
                hintError instanceof Error
                    ? hintError.message
                    : "Could not fetch hint for this question.",
            );
        } finally {
            setIsFetchingHint(false);
        }
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
        <QuizQuestionNavigator
            questions={questions}
            currentQuestionIndex={currentQuestionIndex}
            answers={answers}
            hintedQuestions={hintedQuestions}
            submitted={submitted}
            isQuestionCorrect={isQuestionCorrect}
            onSelectQuestion={(index: number) => {
                if (submitted) {
                    openReviewQuestion(index, showSummary ? "push" : "replace");
                    return;
                }

                setCurrentQuestionIndex(index);
                setShowSummary(false);
                requestQuizView("question", index, "push");
            }}
            questionNavigatorRef={questionNavigatorRef}
            activeQuestionButtonRef={activeQuestionButtonRef}
            onWheel={handleQuestionNavigatorWheel}
            onMouseDown={stopQuestionNavigatorAnimation}
            onTouchStart={stopQuestionNavigatorAnimation}
            onScroll={() => {
                if (navigatorScrollFrameRef.current === null) {
                    navigatorScrollTargetRef.current = questionNavigatorRef.current?.scrollLeft ?? 0;
                }
            }}
        />
    );

    return (
        <PanelShell
            eyebrow={getSectionEyebrowNumber(8, language)}
            title={getSectionTitle("quiz", language)}
            note={
                language === "ja"
                    ? "開始する前にクイズの規定を確認してください。クイズを開始すると、バックグラウンドで次のレッスンも準備されます。"
                    : language === "vi"
                        ? "Xem lại quy định trước khi bắt đầu. Bắt đầu làm bài cũng sẽ chuẩn bị bài học tiếp theo ở chế độ nền."
                        : "Review the quiz regulations before you begin. Starting the quiz also prepares your next lesson in the background."
            }
        >
            <div className="space-y-6">
                {!quizStarted ? (
                    <QuizRegulationsCard
                        language={language}
                        savedAttemptCount={savedAttemptCount}
                        savedBestScore={savedBestScore}
                        savedQuizState={savedQuizState}
                        failedAttempts={failedAttempts}
                        quizStateError={quizStateError}
                        pendingDraft={pendingDraft}
                        nextLesson={nextLesson}
                        onStartQuiz={handleStartQuiz}
                        onResumeQuiz={handleResumeQuiz}
                        onStartOver={handleStartOver}
                    />
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
                                        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-800 dark:text-slate-200">
                                            {language === "ja" ? "レッスンクイズ" : language === "vi" ? "Bài kiểm tra bài học" : "Embedded quiz"}
                                        </p>
                                        <p className="text-lg font-bold text-slate-950 dark:text-white">
                                            {language === "ja"
                                                ? `問題 ${currentQuestionIndex + 1} / ${totalQuestions}`
                                                : language === "vi"
                                                    ? `Câu hỏi ${currentQuestionIndex + 1} / ${totalQuestions}`
                                                    : `Question ${currentQuestionIndex + 1} of ${totalQuestions}`}
                                        </p>
                                    </div>
                                </div>
                                <Progress value={progressValue} indicatorClassName="bg-blue-600" />
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 xl:min-w-[420px]">
                                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-slate-900">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-800 dark:text-slate-200">
                                        {language === "ja" ? "回答数" : language === "vi" ? "Đã trả lời" : "Answered"}
                                    </p>
                                    <p className="mt-1 text-base font-bold text-slate-950 dark:text-white">{answeredCount}</p>
                                </div>
                                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-slate-900">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-800 dark:text-slate-200">
                                        {language === "ja" ? "ステータス" : language === "vi" ? "Trạng thái" : "Status"}
                                    </p>
                                    <p className="mt-1 text-base font-bold text-slate-950 dark:text-white">
                                        {submitted
                                            ? (language === "ja" ? "提出済み" : language === "vi" ? "Đã nộp" : "Submitted")
                                            : (language === "ja" ? "進行中" : language === "vi" ? "Đang làm" : "In progress")}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-slate-900">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-800 dark:text-slate-200">
                                        {language === "ja" ? "正解数" : language === "vi" ? "Số câu đúng" : "Correct"}
                                    </p>
                                    <p className="mt-1 text-base font-bold text-slate-950 dark:text-white">
                                        {submitted ? displayedCorrectCount : "?"}
                                    </p>
                                </div>
                                <div className="col-span-2 rounded-2xl bg-white px-4 py-3 shadow-sm sm:col-span-1 dark:bg-slate-900">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-800 dark:text-slate-200">
                                        {language === "ja" ? "ヒントモード" : language === "vi" ? "Chế độ gợi ý" : "Hint mode"}
                                    </p>
                                    <p className="mt-1 text-base font-bold text-slate-950 dark:text-white">
                                        {hintModeUnlocked
                                            ? (language === "ja" ? `有効 · ${hintedCount}回使用` : language === "vi" ? `Đã mở · ${hintedCount} lần dùng` : `Active · ${hintedCount} used`)
                                            : `${failedAttempts} / ${HINT_UNLOCK_AFTER_FAILURES}`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {nextLesson ? (
                            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-slate-800 dark:bg-slate-900">
                                <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
                                        Next lesson warmup
                                    </p>
                                    <p className="mt-1 font-bold text-slate-950 dark:text-white">
                                        Topic {nextLesson.topic.sort_order} · {nextLesson.lesson.title}
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                                        {nextLessonMessage ??
                                            (nextLessonIsReady
                                                ? "Ready to continue when you finish the quiz."
                                                : "Your next lesson will start preparing after you begin the quiz.")}
                                    </p>
                                    {language !== "en" && (
                                        <p className="mt-1 border-t border-slate-200/80 pt-1 text-sm font-semibold text-slate-950 dark:border-slate-800 dark:text-white">
                                            {nextLessonIsReady
                                                ? (language === "ja" ? "クイズが終了次第、次のレッスンに進むことができます。" : "Sẵn sàng tiếp tục khi bạn hoàn thành bài kiểm tra.")
                                                : (language === "ja" ? "クイズを開始すると、次のレッスンの準備が開始されます。" : "Bài học tiếp theo sẽ bắt đầu chuẩn bị sau khi bạn bắt đầu làm bài.")}
                                        </p>
                                    )}
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
                            <QuizSummaryView
                                language={language}
                                questions={questions}
                                totalQuestions={totalQuestions}
                                displayedCorrectCount={displayedCorrectCount}
                                displayedWeightedScorePercent={displayedWeightedScorePercent}
                                currentAttemptPassed={currentAttemptPassed}
                                lessonPassed={lessonPassed}
                                savedQuizState={savedQuizState}
                                displayedCorrectNoHintCount={displayedCorrectNoHintCount}
                                displayedCorrectWithHintCount={displayedCorrectWithHintCount}
                                failedAttempts={failedAttempts}
                                nextLesson={nextLesson}
                                nextLessonIsReady={nextLessonIsReady}
                                hintModeUnlocked={hintModeUnlocked}
                                isQuestionCorrect={isQuestionCorrect}
                                onRestart={handleRestart}
                                onReviewQuestion={(index: number) => openReviewQuestion(index, "push")}
                            />
                        ) : (
                            <div ref={activeQuestionRef} className="space-y-5">
                                {saveError ? (
                                    <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
                                        {saveError}
                                    </div>
                                ) : null}
                                {(() => {
                                    const activeBackendResult = submitted ? backendQuestionResultsById.get(currentQuestion.id) : undefined;
                                    const activeCorrectAnswer = activeBackendResult
                                        ? (currentQuestion.type === "multi_select"
                                            ? canonicalToDisplayAnswer(currentQuestion, activeBackendResult.correct_answer)
                                            : activeBackendResult.correct_answer)
                                        : undefined;
                                    const activeExplanation = activeBackendResult?.explanation;
                                    const activeIsCorrect = activeBackendResult !== undefined
                                        ? activeBackendResult.is_correct
                                        : (submitted ? isQuestionCorrect(currentQuestion, currentQuestionIndex) : undefined);

                                    if (currentQuestion.type === "fill_blank") {
                                        return (
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
                                                correctAnswer={activeCorrectAnswer}
                                                explanation={activeExplanation}
                                                isCorrect={activeIsCorrect}
                                            />
                                        );
                                    }

                                    if (currentQuestion.type === "multi_select") {
                                        return (
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
                                                isCorrect={activeIsCorrect}
                                                correctAnswer={activeCorrectAnswer}
                                                explanation={activeExplanation}
                                                revealAnswer={currentAttemptPassed}
                                            />
                                        );
                                    }

                                    return (
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
                                            isCorrect={activeIsCorrect}
                                            correctAnswer={activeCorrectAnswer}
                                            explanation={activeExplanation}
                                            revealAnswer={currentAttemptPassed}
                                        />
                                    );
                                })()}

                                <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4 sm:px-5 dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="text-sm">
                                        <p className="font-medium text-slate-800 dark:text-slate-200">
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
                                        </p>
                                        {language !== "en" && (
                                            <p className="mt-1.5 border-t border-slate-200/80 pt-1.5 text-sm font-bold leading-6 text-slate-950 dark:border-slate-800 dark:text-white">
                                                {language === "ja"
                                                    ? submitted
                                                        ? currentQuestionHintUsed
                                                            ? `ヒント適用済み。この回答は${Math.round(HINT_CREDIT * 100)}%のスコアとしてカウントされます。`
                                                            : isQuestionCorrect(currentQuestion, currentQuestionIndex)
                                                                ? "正解です。次の問題に進めます。"
                                                                : currentAttemptPassed
                                                                    ? "確認完了。解説を確認して次に進むことができます。"
                                                                    : "不正解です。不合格の場合は正解が表示されません。レッスンを復習して再挑戦してください。"
                                                        : currentQuestionHintUsed
                                                            ? `ヒント適用済み。提出時にこの問題は${Math.round(HINT_CREDIT * 100)}%のスコアとして計算されます。`
                                                            : hintModeUnlocked
                                                                ? "ヒントモードが有効です。正解を入力したい場合のみ「ヒントを表示」を使用してください。"
                                                                : "「次へ」で進んでください。不合格の場合、正解は表示されません。"
                                                    : submitted
                                                        ? currentQuestionHintUsed
                                                            ? `Đã dùng gợi ý. Câu trả lời này được tính ${Math.round(HINT_CREDIT * 100)}% số điểm.`
                                                            : isQuestionCorrect(currentQuestion, currentQuestionIndex)
                                                                ? "Chính xác. Bạn có thể chuyển sang câu hỏi tiếp theo."
                                                                : currentAttemptPassed
                                                                    ? "Đã xem lại. Bạn có thể đọc giải thích và tiếp tục."
                                                                    : "Chưa chính xác. Đáp án sẽ được ẩn khi chưa đạt. Hãy ôn lại bài học và thử lại."
                                                        : currentQuestionHintUsed
                                                            ? `Đã dùng gợi ý. Câu hỏi này sẽ được tính ${Math.round(HINT_CREDIT * 100)}% số điểm khi bạn nộp bài.`
                                                            : hintModeUnlocked
                                                                ? "Chế độ gợi ý đang bật. Chỉ dùng 'Xem gợi ý' nếu bạn cần điền đáp án đúng."
                                                                : "Chuyển câu hỏi bằng nút 'Tiếp theo'. Các lần làm bài chưa đạt sẽ không hiển thị đáp án đúng."}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
                                        {!submitted && hintModeUnlocked ? (
                                            <Button
                                                className="w-full border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 sm:w-auto"
                                                variant="outline"
                                                onClick={handleRevealHint}
                                                disabled={currentQuestionHintUsed || savingAttempt || isFetchingHint}
                                            >
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                {isFetchingHint
                                                    ? (language === "ja" ? "読み込み中..." : language === "vi" ? "Đang tải..." : "Loading...")
                                                    : currentQuestionHintUsed
                                                    ? (language === "ja" ? "ヒント適用済み" : language === "vi" ? "Đã dùng gợi ý" : "Hint applied")
                                                    : (language === "ja" ? "ヒントを表示" : language === "vi" ? "Xem gợi ý" : "Show hint")}
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
                                            {language === "ja" ? "前へ" : language === "vi" ? "Câu trước" : "Previous"}
                                        </Button>

                                        {submitted ? (
                                            <>
                                                {!isLastQuestion ? (
                                                    <Button
                                                        className="w-full sm:w-auto"
                                                        onClick={handleAdvanceQuestion}
                                                    >
                                                        {language === "ja" ? "次へ" : language === "vi" ? "Câu tiếp" : "Next"}
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
                                                    {language === "ja" ? "サマリーを表示" : language === "vi" ? "Xem kết quả" : "View summary"}
                                                    <Check className="ml-2 h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : !submitted && isLastQuestion ? (
                                            <Button className="w-full sm:w-auto" onClick={handleSubmitQuiz} disabled={savingAttempt}>
                                                {savingAttempt
                                                    ? (language === "ja" ? "保存中..." : language === "vi" ? "Đang lưu..." : "Saving attempt...")
                                                    : (language === "ja" ? "クイズを提出" : language === "vi" ? "Nộp bài kiểm tra" : "Submit quiz")}
                                                <Check className="ml-2 h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                className="w-full sm:w-auto"
                                                onClick={handleAdvanceQuestion}
                                                disabled={savingAttempt}
                                            >
                                                {language === "ja" ? "次へ" : language === "vi" ? "Câu tiếp" : "Next"}
                                                <ChevronRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <QuizIncompleteWarningDialog
                            open={showIncompleteWarning}
                            onOpenChange={setShowIncompleteWarning}
                            language={language}
                            unansweredCount={unansweredCount}
                            firstUnansweredQuestionIndex={firstUnansweredQuestionIndex}
                            savingAttempt={savingAttempt}
                            onGoToFirstUnanswered={handleGoToFirstUnansweredQuestion}
                            onConfirmSubmit={handleConfirmSubmitQuiz}
                        />
                    </>
                ) : null}
            </div>
        </PanelShell>
    );
}
