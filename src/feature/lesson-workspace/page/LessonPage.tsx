import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BookOpen } from "lucide-react";
import { MainNavigationMenu } from "@/common/component/MainNavigationMenu";
import { useAuth } from "@/common/context/AuthContext";
import { fetchCurrentUserProfile } from "@/feature/auth/api/authAPI";
import type { UserProfileResponse } from "@/feature/auth/type/Auth";
import {
    fetchRoadmap,
    type RoadmapResponse,
} from "@/feature/learning-path/api/roadmapApi";
import {
    isLessonGenerated,
    isLessonGenerationFailed,
} from "@/feature/learning-path/lessonAccess";
import { DailyStudyGoalDialog } from "@/common/component/shared-dialog";
import { getTrackedStudyMinutesByDay, recordStudyTime } from "@/common/utils/StudyActivity";
import {
    getStudyMinutesForDate,
    getTodayDateKey,
    readStudyGoalDecision,
    writeStudyGoalDecision,
    type StudyGoalDecision,
} from "@/common/utils/dailyStudyGoal";
import {
    getDifficultyBadgeClasses,
    getSkillBadgeClasses,
    getTrackBadgeClasses,
} from "@/common/utils/historyBadgeStyles";
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
import { Button } from "@/shadcn/component/ui/button";
import { FuriganaToggle } from "../component/layout";
import { LessonSkeleton } from "../component/skeleton";
import { EmbeddedLessonQuiz } from "../component/quiz";
import { EmptyPanel, SectionButton, stopSpeech } from "../component/shared";
import {
    DialogueSection,
    ListeningPracticeSection,
    PhrasesSection,
    ReadingPracticeSection,
    ScenarioSection,
    VocabularySection,
    WrapupSection,
} from "../component/theory";

import {
    LessonLanguageProvider,
    useLessonLanguage,
} from "../context/LessonLanguageContext";
import type {
    LessonHistoryView,
    ParsedTheorySection,
    SidebarSectionKey,
} from "../type/lessonWorkspace";
import {
    buildEmbeddedQuizQuestions,
    isEmbeddedLessonQuizCompletedSnapshotCompatible,
    isEmbeddedLessonQuizDraftCompatible,
    readEmbeddedLessonQuizCompletedSnapshot,
    readEmbeddedLessonQuizDraft,
} from "../util/embeddedQuizPersistence";
import {
    SECTION_META,
    SECTION_I18N,
    formatDifficulty,
    formatSkill,
    formatTrack,
} from "../util/lessonFormatters";
import {
    areLessonHistoryViewsEqual,
    buildLessonHistoryView,
    findLesson,
    findNextLesson,
    readBrowserHistoryState,
    readLessonHistoryViewFromState,
    stripLegacyLessonHistoryState,
} from "../util/lessonNavigation";
import {
    normalizeQuizContent,
    normalizeTheoryContent,
} from "../util/lessonParsers";

function renderTheorySection(section: ParsedTheorySection) {
    switch (section.key) {
        case "scenario": {
            return <ScenarioSection section={section} />;
        }

        case "vocab": {
            return <VocabularySection section={section} />;
        }

        case "phrases": {
            return <PhrasesSection section={section} />;
        }

        case "reading": {
            const qas = Array.isArray(section.raw?.qa)
                ? section.raw.qa
                : [];
            return <ReadingPracticeSection section={section} qas={qas} />;
        }

        case "dialogue": {
            return <DialogueSection section={section} />;
        }

        case "listening": {
            return <ListeningPracticeSection section={section} />;
        }

        case "wrapup": {
            return <WrapupSection section={section} />;
        }
    }
}


export function LessonPage({ lessonId }: { lessonId: number }) {
    return (
        <LessonLanguageProvider>
            <LessonPageContent lessonId={lessonId} />
        </LessonLanguageProvider>
    );
}

function LessonPageContent({ lessonId }: { lessonId: number }) {
    const auth = useAuth();
    const navigate = useNavigate();
    const { language } = useLessonLanguage();
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
        const handleStopOtherAudio = () => {
            stopSpeech();
        };
        window.addEventListener("app:stop-other-audio", handleStopOtherAudio);
        return () => {
            window.removeEventListener("app:stop-other-audio", handleStopOtherAudio);
        };
    }, []);

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
            || !isLessonGenerated(lessonLookup.lesson)
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
            || !isLessonGenerated(lessonLookup.lesson)
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
                            {language === "ja" ? "このレッスンを読み込めません" : language === "vi" ? "Không thể tải bài học này" : "Cannot load this lesson"}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            {error}
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <Button onClick={() => window.location.reload()}>
                                {language === "ja" ? "再試行" : language === "vi" ? "Thử lại" : "Retry"}
                            </Button>
                            <Button asChild variant="outline">
                                <Link to="/lessons/learning-path">
                                    {language === "ja" ? "ロードマップに戻る" : language === "vi" ? "Quay lại lộ trình" : "Back to roadmap"}
                                </Link>
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
                            {language === "ja" ? "レッスンが見つかりません" : language === "vi" ? "Không tìm thấy bài học" : "Lesson not found"}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            {language === "ja"
                                ? "このレッスンは現在のロードマップに含まれていません。"
                                : language === "vi"
                                    ? "Bài học này không nằm trong lộ trình hiện tại của bạn."
                                    : "This lesson is not part of your current roadmap."}
                        </p>
                        <div className="mt-6">
                            <Button asChild variant="outline">
                                <Link to="/lessons/learning-path">
                                    {language === "ja" ? "ロードマップに戻る" : language === "vi" ? "Quay lại lộ trình" : "Back to roadmap"}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const { lesson, topic, track } = lessonLookup;

    if (!isLessonGenerated(lesson)) {
        const isFailed = isLessonGenerationFailed(lesson);
        return (
            <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
                <MainNavigationMenu />
                <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-lg font-semibold text-slate-950 dark:text-white">
                            {isFailed
                                ? (language === "ja" ? "レッスンコンテンツの生成に失敗しました" : language === "vi" ? "Tạo nội dung bài học thất bại" : "Lesson generation failed")
                                : (language === "ja" ? "レッスンコンテンツはまだ準備ができていません" : language === "vi" ? "Nội dung bài học chưa sẵn sàng" : "Lesson content is not ready yet")}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            {isFailed
                                ? (language === "ja"
                                    ? "コンテンツの生成中にエラーが発生しました。管理者にお問い合わせいただくか、後でもう一度お試しください。"
                                    : language === "vi"
                                        ? "Đã có lỗi trong quá trình tạo nội dung. Vui lòng thử lại sau hoặc liên hệ quản trị viên."
                                        : "An error occurred during generation. Please try again later or contact administrator.")
                                : (language === "ja"
                                    ? "このレッスンの理論およびクイズコンテンツはまだ生成されていません。"
                                    : language === "vi"
                                        ? "Nội dung lý thuyết và bài kiểm tra cho bài học này chưa được tạo."
                                        : "Theory and quiz content have not been generated for this lesson yet.")}
                        </p>
                        <div className="mt-6">
                            <Button asChild variant="outline">
                                <Link to="/lessons/learning-path">
                                    {language === "ja" ? "ロードマップに戻る" : language === "vi" ? "Quay lại lộ trình" : "Back to roadmap"}
                                </Link>
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
                            {language === "ja" ? "レッスンはロックされています" : language === "vi" ? "Bài học đang bị khóa" : "Lesson is locked"}
                        </p>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            {language === "ja"
                                ? "このレッスンのロックを解除するには、このトピックの前のレッスンに合格してください。"
                                : language === "vi"
                                    ? "Hãy hoàn thành bài học trước đó trong chủ đề này để mở khóa bài học này."
                                    : "Pass the previous lesson in this topic to unlock this lesson."}
                        </p>
                        <div className="mt-6">
                            <Button asChild variant="outline">
                                <Link to="/lessons/learning-path">
                                    {language === "ja" ? "ロードマップに戻る" : language === "vi" ? "Quay lại lộ trình" : "Back to roadmap"}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_22%,#f8fafc_100%)] text-slate-950 dark:bg-none dark:bg-slate-950 dark:text-white">
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
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <Button variant="outline" size="sm" onClick={handleBackToRoadmap}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {language === "ja" ? "ロードマップに戻る" : language === "vi" ? "Quay lại lộ trình" : "Back to roadmap"}
                            </Button>
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getTrackBadgeClasses(track)}`}>
                                {formatTrack(track, language)}
                            </span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getSkillBadgeClasses(topic.primary_skill || lesson.primary_skill)}`}>
                                {formatSkill(topic.primary_skill || lesson.primary_skill, language)}
                            </span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getDifficultyBadgeClasses(lesson.difficulty_tier)}`}>
                                {formatDifficulty(lesson.difficulty_tier, language)}
                            </span>
                        </div>
                        {language === "ja" && (
                            <div className="ml-auto">
                                <FuriganaToggle />
                            </div>
                        )}
                    </div>

                    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                                {language === "ja"
                                    ? `トピック ${topic.sort_order} · ${topic.name}`
                                    : language === "vi"
                                        ? `Chủ đề ${topic.sort_order} · ${topic.name}`
                                        : `Topic ${topic.sort_order} · ${topic.name}`}
                            </p>
                            <h1 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                                {lesson.title}
                            </h1>
                            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                                {language === "ja"
                                    ? "このページでは、データベースのロードマップから選択したレッスンのC-1理論とC-2クイズコンテンツを表示します。"
                                    : language === "vi"
                                        ? "Trang này hiển thị nội dung lý thuyết C-1 và bài kiểm tra C-2 cho bài học đã chọn từ lộ trình học tập."
                                        : "This page renders the stored C-1 theory and C-2 quiz content for your selected lesson directly from the database-backed roadmap."}
                            </p>
                        </div>

                        {/* Readiness summary card: visible on desktop, hidden on phone to save vertical space */}
                        <div className="hidden lg:grid gap-3 rounded-3xl bg-slate-50 p-4 sm:p-5 dark:bg-slate-800/60">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                        {language === "ja" ? "利用可能" : language === "vi" ? "SẴN SÀNG" : "READY NOW"}
                                    </p>
                                    <p className="font-semibold text-slate-950 dark:text-white">
                                        {language === "ja"
                                            ? "7つの理論セクション + クイズ"
                                            : language === "vi"
                                                ? "7 phần lý thuyết + quiz"
                                                : "7 theory sections + quiz"}
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                                {language === "ja"
                                    ? "左側のナビゲーションを使用して、7つの理論セクションと最終クイズタブの間を移動します。"
                                    : language === "vi"
                                        ? "Sử dụng thanh điều hướng bên trái để di chuyển giữa 7 phần lý thuyết và bài kiểm tra cuối cùng."
                                        : "Use the left navigation to move between the seven theory sections and the final quiz tab."}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Mobile horizontal section selector (prevents scrolling through 8 full-width cards on phone) */}
                <div className="xl:hidden sticky top-14 z-20 -mx-3 sm:-mx-6 mb-3 px-3 sm:px-6 py-2.5 bg-white/95 backdrop-blur-md border-y border-slate-200/80 shadow-2xs dark:bg-slate-900/95 dark:border-slate-800">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
                        {SECTION_META.map((meta) => {
                            const Icon = meta.icon;
                            const i18n = SECTION_I18N[meta.key];
                            const label = i18n?.label[language] || meta.label;
                            const isActive = meta.key === activeSection;
                            return (
                                <button
                                    key={meta.key}
                                    type="button"
                                    onClick={() => handleSectionChange(meta.key)}
                                    className={`flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                                        isActive
                                            ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20"
                                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5 shrink-0" />
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-3 xl:mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                    {/* Desktop sidebar */}
                    <aside className="hidden xl:block xl:sticky xl:top-24 xl:self-start">
                        <div className="rounded-[28px] border border-slate-200 bg-white p-3 sm:p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-4 px-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                    {language === "ja" ? "レッスンマップ" : language === "vi" ? "BẢN ĐỒ BÀI HỌC" : "Lesson map"}
                                </p>
                                <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                                    {language === "ja" ? "8つのセクション" : language === "vi" ? "8 phần học" : "8 sections"}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
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
                                    title={language === "ja" ? "セクション利用不可" : language === "vi" ? "Phần học không khả dụng" : "Section unavailable"}
                                    message={
                                        language === "ja"
                                            ? "このセクションはレッスンのデータに見つからないか、形式が正しくありません。"
                                            : language === "vi"
                                                ? "Phần này bị thiếu hoặc sai định dạng trong dữ liệu bài học."
                                                : "This section is missing or malformed in the stored lesson payload."
                                    }
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
                                {language === "ja"
                                    ? "進行中のクイズを離れますか？"
                                    : language === "vi"
                                        ? "Rời khỏi bài kiểm tra đang làm?"
                                        : "Leave quiz in progress?"}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="pt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                {language === "ja"
                                    ? "クイズの受験は進行中です。誤って移動しないよう警告が表示されています。"
                                    : language === "vi"
                                        ? "Bài kiểm tra của bạn vẫn đang diễn ra. Cảnh báo này giúp bạn không vô tình rời khỏi trang."
                                        : "Your quiz attempt is still in progress. If you leave this quiz tab, a warning is shown so you do not move away by accident."}
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                            {language === "ja"
                                ? "クイズに残って解答を続けるか、後で戻って保存した下書きから再開することができます。"
                                : language === "vi"
                                    ? "Bạn có thể ở lại làm tiếp hoặc rời đi và quay lại sau để tiếp tục từ bản nháp đã lưu."
                                    : "You can stay in the quiz and continue answering, or leave and come back later to resume from your saved draft."}
                        </div>

                        <AlertDialogFooter className="mt-6">
                            <AlertDialogCancel onClick={handleCancelQuizLeave}>
                                {language === "ja" ? "クイズを続ける" : language === "vi" ? "Ở lại làm tiếp" : "Stay in quiz"}
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmQuizLeave}>
                                {language === "ja" ? "クイズを離れる" : language === "vi" ? "Rời khỏi" : "Leave quiz"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
