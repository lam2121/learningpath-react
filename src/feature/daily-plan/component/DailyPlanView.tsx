import {
    BookOpen,
    Brain,
    ChevronDown,
    Clock,
    RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/common/context/AuthContext";
import {
    fetchCurrentUserProfile,
    generateAICoachMessage,
} from "@/feature/auth/api/authAPI";
import type { UserProfileResponse } from "@/feature/auth/type/Auth";
import { Card, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
import { useTranslation } from "react-i18next";
import type { RoadmapLesson, RoadmapTopic } from "@/feature/learning-path/api/roadmapApi";
import { isLessonReadyToStudy } from "@/feature/learning-path/lessonAccess";
import { userProfileTexts } from "@/feature/user-profile/userProfileTexts";
import {
    getTrackedStudyMinutesByDay,
    calculateLongestStreak,
    getLoginDays,
} from "@/common/utils/StudyActivity";
import {
    getStudyMinutesForDate,
    getTodayDateKey,
    readStudyGoalDecision,
    type StudyGoalDecision,
} from "@/common/utils/dailyStudyGoal";
import { fetchFlashcards } from "@/feature/lesson-workspace/api/flashcardApi";
import { useCareerTrackReset } from "@/feature/user-profile/hook/useCareerTrackReset";
import { fetchQuizReview } from "@/feature/daily-review";

import {
    formatDifficultyTier,
    formatMinutes,
    estimateDays,
} from "../utils/dailyPlanFormatters";
import { DailyGoalBudgetSection } from "./DailyGoalBudgetSection";
import { DailyActionsList } from "./DailyActionsList";
import { AICoachCard } from "./AICoachCard";
import { StudySettingsCard } from "./StudySettingsCard";
import { getIntlLocale } from "@/common/utils/historyFormatters";
import { DailyPlanModals } from "./DailyPlanModals";

function formatProfileDate(value: string | null | undefined, locale = "en-US") {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(parsed);
}

type DailyPlanViewProps = {
    nextTopic: RoadmapTopic | null;
    nextLesson: RoadmapLesson | null;
    hasRoadmap: boolean;
    completedLessonCount: number;
    totalAssignedLessons: number;
    allAssignedLessonsCompleted: boolean;
    onStudyPlanExpandedChange?: (expanded: boolean) => void;
};

export function DailyPlanView({
    nextTopic,
    nextLesson,
    hasRoadmap,
    completedLessonCount,
    totalAssignedLessons,
    allAssignedLessonsCompleted,
    onStudyPlanExpandedChange,
}: DailyPlanViewProps) {
    const { t, i18n } = useTranslation("profile");
    const minUnit = t("min", { defaultValue: "min" });
    const currentLocale = getIntlLocale(i18n.language);
    const { user } = useAuth();
    const userId = Number(user?.id);
    const [isStudyPlanExpanded, setIsStudyPlanExpanded] = useState(false);
    const [openSetting, setOpenSetting] = useState(false);
    const [openStudyTime, setOpenStudyTime] = useState(false);
    const [openCareerAlert, setOpenCareerAlert] = useState(false);
    const [openStudyTimeAlert, setOpenStudyTimeAlert] = useState(false);
    const [savedFlashcardsCount, setSavedFlashcardsCount] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const cards = await fetchFlashcards();
                if (!cancelled) {
                    setSavedFlashcardsCount(cards.length);
                }
            } catch {
                // Background count fetch - ignore error
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const [currentMinutes, setCurrentMinutes] = useState(120);
    const [newMinutes, setNewMinutes] = useState(120);
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [totalEstimatedMinutes, setTotalEstimatedMinutes] = useState(0);
    const [isSavingStudyTime, setIsSavingStudyTime] = useState(false);
    const [studyTimeError, setStudyTimeError] = useState<string | null>(null);
    const [trackedStudyMinutesByDay, setTrackedStudyMinutesByDay] = useState<Record<string, number>>(
        () => (Number.isFinite(userId) ? getTrackedStudyMinutesByDay(userId) : {}),
    );
    const [studyGoalDecision, setStudyGoalDecision] = useState<StudyGoalDecision | null>(
        () => (Number.isFinite(userId) ? readStudyGoalDecision(userId, getTodayDateKey()) : null),
    );
    const [reviewCount, setReviewCount] = useState<number>(0);
    const {
        clearResetError,
        isResetting,
        resetCareerTrack,
        resetError,
    } = useCareerTrackReset();

    useEffect(() => {
        let isMounted = true;

        const loadProfile = async () => {
            try {
                const profile = await fetchCurrentUserProfile();
                if (!isMounted) {
                    return;
                }
                const minutes = profile.daily_study_minutes || 120;
                setProfile(profile);
                setCurrentMinutes(minutes);
                setNewMinutes(minutes);
                setTotalEstimatedMinutes(profile.total_estimated_minutes);
                if (typeof profile.quiz_review_count === "number") {
                    setReviewCount(profile.quiz_review_count);
                }
            } catch {
                if (!isMounted) {
                    return;
                }
                setCurrentMinutes(120);
                setNewMinutes(120);
                setTotalEstimatedMinutes(0);
            }
        };

        void loadProfile();

        const handleProfileUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<UserProfileResponse>;
            if (!isMounted) {
                return;
            }
            const minutes = customEvent.detail.daily_study_minutes || 120;
            setProfile(customEvent.detail);
            setCurrentMinutes(minutes);
            setNewMinutes(minutes);
            setTotalEstimatedMinutes(customEvent.detail.total_estimated_minutes);
            if (typeof customEvent.detail.quiz_review_count === "number") {
                setReviewCount(customEvent.detail.quiz_review_count);
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

    useEffect(() => {
        if (!Number.isFinite(userId)) {
            setTrackedStudyMinutesByDay({});
            setStudyGoalDecision(null);
            return;
        }

        setTrackedStudyMinutesByDay(getTrackedStudyMinutesByDay(userId));
        setStudyGoalDecision(readStudyGoalDecision(userId, getTodayDateKey()));
    }, [userId]);

    useEffect(() => {
        let isMounted = true;
        const loadReviewCount = async () => {
            try {
                const data = await fetchQuizReview(1);
                if (isMounted) {
                    setReviewCount(data.total_count);
                }
            } catch {
                // Ignore failure
            }
        };
        void loadReviewCount();

        const handleReviewUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<{ remainingCount?: number }>;
            if (typeof customEvent.detail?.remainingCount === "number") {
                setReviewCount(customEvent.detail.remainingCount);
            }
        };

        window.addEventListener("careerpath:review-updated", handleReviewUpdated);
        return () => {
            isMounted = false;
            window.removeEventListener("careerpath:review-updated", handleReviewUpdated);
        };
    }, []);

    const [coachMessage, setCoachMessage] = useState<string | null>(null);
    const [isGeneratingCoach, setIsGeneratingCoach] = useState(false);

    useEffect(() => {
        if (!profile || !userId || !Number.isFinite(userId)) return;

        const loadCoachMessage = async () => {
            const todayKey = getTodayDateKey();
            const storageKey = `careerpath:ai-coach-msg:${userId}:${todayKey}`;
            const cachedMsg = localStorage.getItem(storageKey);
            if (cachedMsg) {
                setCoachMessage(cachedMsg);
                return;
            }

            try {
                setIsGeneratingCoach(true);
                const history = profile.lesson_quiz_history ?? [];
                const validScores = history.filter((item) => typeof item.best_score_percent === "number" && item.best_score_percent > 0);
                const accuracy = validScores.length > 0
                    ? validScores.reduce((sum, item) => sum + (item.best_score_percent ?? 0), 0) / validScores.length
                    : 0;

                const response = await generateAICoachMessage({
                    day_streak: calculateLongestStreak(getLoginDays(userId)),
                    lesson_learner: completedLessonCount,
                    total_lesson_in_track: totalAssignedLessons,
                    accuracy: Math.round(accuracy),
                    daily_study_per_day: profile.daily_study_minutes,
                });

                if (response.feedback_summary) {
                    setCoachMessage(response.feedback_summary);
                    localStorage.setItem(storageKey, response.feedback_summary);
                }
            } catch (error) {
                console.error("Failed to generate AI Coach message", error);
            } finally {
                setIsGeneratingCoach(false);
            }
        };

        void loadCoachMessage();
    }, [profile, userId, completedLessonCount, totalAssignedLessons]);

    useEffect(() => {
        onStudyPlanExpandedChange?.(isStudyPlanExpanded);
    }, [isStudyPlanExpanded, onStudyPlanExpandedChange]);

    const todayDateKey = getTodayDateKey();
    const lessonTitleWithQuotes = nextLesson ? `'${nextLesson.title}'` : "";
    const lessonLabel = allAssignedLessonsCompleted
        ? t("reviewLearningPath", { defaultValue: "Review Learning Path" })
        : isLessonReadyToStudy(nextLesson)
            ? (nextLesson
                ? `Start with ${lessonTitleWithQuotes}`
                : t("startLearning", { defaultValue: "Start Learning" }))
            : t("viewLearningPath", { defaultValue: "View Learning Path" });
    const lessonDescription = nextLesson
        ? `${lessonTitleWithQuotes} · ${formatDifficultyTier(nextLesson.difficulty_tier, t)} · ${formatMinutes(nextLesson.estimated_minutes, minUnit, t("estimatePending", { defaultValue: "Estimate pending" }))}`
        : allAssignedLessonsCompleted
            ? t("allAssignedLessonsPassedDesc", {
                count: totalAssignedLessons,
                defaultValue: `All ${totalAssignedLessons} assigned lessons have a passed quiz result.`,
            })
            : t("nextLessonAppearHere", {
                defaultValue: "Your next lesson will appear here once your roadmap is ready.",
            });
    const lessonOutcome = nextLesson && nextTopic
        ? t("learnTopicPatterns", {
            topic: nextTopic.name,
            defaultValue: `Learn the language patterns needed for ${nextTopic.name} and keep your roadmap moving forward.`,
        })
        : allAssignedLessonsCompleted
            ? t("allAssignedQuizzesPassedOutcome", {
                defaultValue:
                    "You have finished every assigned lesson quiz in this roadmap. Review previous lessons or continue from the learning path if new content appears.",
            })
            : t("openLearningPathTopicsOrder", {
                defaultValue: "Open your learning path to see your assigned topics and recommended lesson order.",
            });

    const currentDays = estimateDays(totalEstimatedMinutes, currentMinutes) ?? 0;
    const projectedDays = estimateDays(totalEstimatedMinutes, newMinutes) ?? 0;
    const lessonMinutes = nextLesson?.estimated_minutes ?? 0;
    const backendStudiedTodayMinutes = getStudyMinutesForDate(
        profile?.study_history,
        todayDateKey,
    );
    const trackedStudiedTodayMinutes = trackedStudyMinutesByDay[todayDateKey] ?? 0;
    const todayLearnedMinutes = backendStudiedTodayMinutes + trackedStudiedTodayMinutes;
    const dailyStudyMinutes = currentMinutes;
    const timeBudgetUsage =
        dailyStudyMinutes > 0
            ? Math.min(100, Math.round((todayLearnedMinutes / dailyStudyMinutes) * 100))
            : 0;
    const remainingTodayMinutes = Math.max(0, dailyStudyMinutes - todayLearnedMinutes);
    const bonusTodayMinutes = Math.max(0, todayLearnedMinutes - dailyStudyMinutes);
    const hasMetTodayGoal = dailyStudyMinutes > 0 && todayLearnedMinutes >= dailyStudyMinutes;
    const estimatedFinishLabel = formatProfileDate(profile?.estimated_finish, currentLocale);
    const budgetCardClass = hasMetTodayGoal
        ? "rounded-3xl border border-emerald-200 bg-[linear-gradient(135deg,_rgba(236,253,245,1)_0%,_rgba(240,249,255,1)_52%,_rgba(219,234,254,1)_100%)] p-4 shadow-[0_18px_45px_rgba(16,185,129,0.12)] ring-1 ring-emerald-100"
        : "space-y-2";

    const [currentRoutineIndex, setCurrentRoutineIndex] = useState<number>(0);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setCurrentRoutineIndex((prev) => (prev + 1) % 3);
        }, 3000);

        return () => window.clearInterval(timer);
    }, []);

    const routineConfigs = [
        {
            key: "new_lesson",
            label: t("newLesson", { defaultValue: "New Lesson" }),
            badge: nextTopic
                ? t("topicWithOrder", { order: nextTopic.sort_order, defaultValue: `Topic ${nextTopic.sort_order}` })
                : t("nextUp", { defaultValue: "Next Up" }),
            icon: BookOpen,
            accentGradient: "from-blue-600 via-indigo-600 to-[#00A9CE]",
            iconBg: "bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-500/25",
            topBarGradient: "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500",
            badgeClass: "bg-blue-100/90 text-blue-900 border-blue-200 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-800",
            borderClass: "border-blue-300 dark:border-blue-700 shadow-[0_10px_30px_rgba(37,99,235,0.06)]",
            activePill: "bg-blue-600 text-white shadow-blue-500/25",
            title: allAssignedLessonsCompleted
                ? t("allLessonsDone", { defaultValue: "Today's lessons are done" })
                : nextLesson
                    ? t("startWithLesson", {
                        title: lessonTitleWithQuotes,
                        defaultValue: `Start with ${lessonTitleWithQuotes}`,
                    })
                    : hasRoadmap
                        ? t("roadmapReadyToExplore", { defaultValue: "Your roadmap is ready to explore" })
                        : t("roadmapBeingPrepared", { defaultValue: "Your roadmap is being prepared" }),
            description: allAssignedLessonsCompleted
                ? t("passedQuizzesCount", {
                    completed: completedLessonCount,
                    total: totalAssignedLessons,
                    defaultValue: `You have already passed ${completedLessonCount} of ${totalAssignedLessons} assigned lesson quizzes.`,
                })
                : nextLesson && nextTopic
                    ? t("todayTopicFocusDesc", {
                        order: nextTopic.sort_order,
                        topic: nextTopic.name,
                        defaultValue: `Your main focus today is Topic ${nextTopic.sort_order}: ${nextTopic.name}. This lesson is the clearest next action for your track.`,
                    })
                    : hasRoadmap
                        ? t("openLearningPathDesc", {
                            defaultValue: "Open your learning path to see the clearest next lesson and roadmap order for your track.",
                        })
                        : t("openLearningPathWhenAvailable", {
                            defaultValue: "Open your learning path once your assigned roadmap is available.",
                        }),
        },
        {
            key: "review",
            label: t("review", { defaultValue: "Review" }),
            badge: reviewCount > 0
                ? t("itemsToReview", { count: reviewCount, defaultValue: `${reviewCount} to review` })
                : (completedLessonCount > 0 ? t("allCaughtUp", { defaultValue: "Up to date" }) : t("practice", { defaultValue: "Practice" })),
            icon: RotateCcw,
            accentGradient: "from-amber-500 via-orange-500 to-yellow-500",
            iconBg: "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/25",
            topBarGradient: "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400",
            badgeClass: "bg-amber-100/90 text-amber-900 border-amber-200 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800",
            borderClass: "border-amber-300 dark:border-amber-700 shadow-[0_10px_30px_rgba(245,158,11,0.06)]",
            activePill: "bg-amber-500 text-white shadow-orange-500/25",
            title: reviewCount > 0
                ? t("reviewQuestionsCountTitle", {
                    count: reviewCount,
                    defaultValue: `Review ${reviewCount} Missed Questions`,
                })
                : completedLessonCount > 0
                    ? t("allCaughtUp", { defaultValue: "All Caught Up on Review" })
                    : t("review", { defaultValue: "Daily Review & Practice" }),
            description: reviewCount > 0
                ? t("practiceMistakesDesc", {
                    defaultValue: "Practice your past quiz mistakes now to reinforce your understanding and clear them from your review pool.",
                })
                : completedLessonCount > 0
                    ? t("greatRetentionDesc", {
                        defaultValue: "Great retention! Questions you miss on future quizzes will be saved here for daily morning review.",
                    })
                    : t("reviewQuestionsAppearHere", {
                        defaultValue: "Review questions will appear here after you complete lesson quizzes to reinforce retention.",
                    }),
        },
        {
            key: "flashcards",
            label: userProfileTexts.flashcards(),
            badge: savedFlashcardsCount != null && savedFlashcardsCount > 0
                ? t("cardsCountBadge", { count: savedFlashcardsCount, defaultValue: `${savedFlashcardsCount} cards` })
                : t("vocabulary", { defaultValue: "Vocabulary" }),
            icon: Brain,
            accentGradient: "from-purple-600 via-indigo-600 to-pink-500",
            iconBg: "bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white shadow-md shadow-purple-500/25",
            topBarGradient: "bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500",
            badgeClass: "bg-purple-100/90 text-purple-900 border-purple-200 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-800",
            borderClass: "border-purple-300 dark:border-purple-700 shadow-[0_10px_30px_rgba(168,85,247,0.06)]",
            activePill: "bg-purple-600 text-white shadow-purple-500/25",
            title: savedFlashcardsCount != null && savedFlashcardsCount > 0
                ? userProfileTexts.reviewFlashcards()
                : userProfileTexts.flashcards(),
            description: savedFlashcardsCount != null && savedFlashcardsCount > 0
                ? userProfileTexts.flashcardsSubtitle()
                : userProfileTexts.flashcardsSectionDesc(),
        },
    ];

    const currentRoutineItem = routineConfigs[currentRoutineIndex];

    const handleStudySettingsUpdated = (updatedProfile: UserProfileResponse) => {
        const minutes = updatedProfile.daily_study_minutes || 120;
        setProfile(updatedProfile);
        setCurrentMinutes(minutes);
        setNewMinutes(minutes);
        setTotalEstimatedMinutes(updatedProfile.total_estimated_minutes);
        window.dispatchEvent(
            new CustomEvent<UserProfileResponse>("careerpath:profile-updated", {
                detail: updatedProfile,
            }),
        );
    };

    return (
        <>
            <div className="flex w-full shrink-0 flex-col gap-5">
                <Card className={`relative overflow-hidden rounded-3xl border transition-all duration-500 bg-white shadow-xs dark:bg-slate-900 ${currentRoutineItem.borderClass}`}>
                    {/* Dynamic top bar gradient that changes color with the active routine */}
                    <div className={`pointer-events-none absolute inset-x-0 top-0 h-1.5 transition-all duration-500 ${currentRoutineItem.topBarGradient}`} />

                    <button
                        type="button"
                        onClick={() => setIsStudyPlanExpanded((current) => !current)}
                        aria-expanded={isStudyPlanExpanded}
                        className="group w-full block min-w-0 max-w-full text-left cursor-pointer transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-800/40"
                    >
                        <CardHeader className={`space-y-4 px-4 sm:px-6 pt-6 ${isStudyPlanExpanded ? "pb-4" : "pb-6"} w-full min-w-0 max-w-full overflow-hidden`}>
                            {/* Routine switcher header with title and 3s pills */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5 w-full min-w-0">
                                <div className="flex shrink-0 items-center gap-2">
                                    <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                                        {t("dailyPlan", { defaultValue: "Daily Plan" })}
                                    </h3>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        <Clock className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                                        <span>{t("routineTimerLabel", { defaultValue: "Routine (3s)" })}</span>
                                    </span>
                                </div>

                                {/* 3s Routine Navigation Pills */}
                                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                                    {routineConfigs.map((step, idx) => {
                                        const StepIcon = step.icon;
                                        const isActive = currentRoutineIndex === idx;
                                        return (
                                            <button
                                                key={step.key}
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCurrentRoutineIndex(idx);
                                                }}
                                                className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold transition-all duration-300 ${
                                                    isActive
                                                        ? `${step.activePill} shadow-sm scale-105`
                                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300"
                                                }`}
                                            >
                                                <StepIcon className="h-3 w-3" />
                                                <span>{step.label}</span>
                                                {isActive && (
                                                    <span className="relative flex h-1.5 w-1.5">
                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                                                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-start justify-between gap-3 sm:gap-4 w-full min-w-0">
                                <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1 overflow-hidden">
                                    {/* Icon badge with dynamic color change */}
                                    <div className={`flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-all duration-500 group-hover:scale-105 ${currentRoutineItem.iconBg}`}>
                                        <currentRoutineItem.icon className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300" />
                                    </div>

                                    <div className="min-w-0 flex-1 space-y-1.5 overflow-hidden">
                                        <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden h-6 w-full min-w-0">
                                            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 sm:px-2.5 py-0.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${currentRoutineItem.badgeClass}`}>
                                                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                                                {currentRoutineItem.badge}
                                            </span>

                                            {currentRoutineItem.key === "new_lesson" && nextTopic ? (
                                                <span
                                                    className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-indigo-200/90 bg-indigo-50/95 px-2 sm:px-2.5 py-0.5 text-[11px] sm:text-xs font-bold text-slate-900 shadow-2xs dark:border-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-100 max-w-[150px] sm:max-w-[200px]"
                                                    title={nextTopic.name}
                                                >
                                                    <span className="shrink-0 text-[10px] sm:text-[11px] font-extrabold uppercase text-indigo-700 dark:text-indigo-400">
                                                        {t("topicLabelPrefix", { defaultValue: "Topic:" })}
                                                    </span>
                                                    <span className="truncate">{nextTopic.name}</span>
                                                </span>
                                            ) : null}
                                        </div>

                                        <CardTitle
                                            className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-slate-900 transition-colors duration-300 dark:text-white truncate block w-full min-w-0 leading-7 sm:leading-8 h-7 sm:h-8"
                                            title={currentRoutineItem.title}
                                        >
                                            {currentRoutineItem.title}
                                        </CardTitle>

                                        <p
                                            className="text-xs sm:text-sm font-medium leading-5 text-slate-700 transition-colors duration-300 dark:text-slate-200 line-clamp-2 h-10 overflow-hidden w-full min-w-0"
                                            title={currentRoutineItem.description}
                                        >
                                            {currentRoutineItem.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50 text-slate-700 shadow-xs transition-all duration-300 group-hover:border-blue-300 group-hover:bg-blue-50 group-hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    <ChevronDown
                                        className={`h-5 w-5 transition-transform duration-300 ease-in-out ${
                                            isStudyPlanExpanded ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                                        }`}
                                    />
                                </div>
                            </div>

                            <DailyGoalBudgetSection
                                hasMetTodayGoal={hasMetTodayGoal}
                                todayLearnedMinutes={todayLearnedMinutes}
                                currentMinutes={currentMinutes}
                                minUnit={minUnit}
                                timeBudgetUsage={timeBudgetUsage}
                                bonusTodayMinutes={bonusTodayMinutes}
                                remainingTodayMinutes={remainingTodayMinutes}
                                isStudyPlanExpanded={isStudyPlanExpanded}
                                budgetCardClass={budgetCardClass}
                                studyGoalDecision={studyGoalDecision}
                            />
                        </CardHeader>
                    </button>

                    <DailyActionsList
                        nextLesson={nextLesson}
                        nextTopic={nextTopic}
                        allAssignedLessonsCompleted={allAssignedLessonsCompleted}
                        completedLessonCount={completedLessonCount}
                        lessonLabel={lessonLabel}
                        lessonDescription={lessonDescription}
                        lessonOutcome={lessonOutcome}
                        minUnit={minUnit}
                        remainingTodayMinutes={remainingTodayMinutes}
                        reviewCount={reviewCount}
                        savedFlashcardsCount={savedFlashcardsCount}
                        isStudyPlanExpanded={isStudyPlanExpanded}
                        activeRoutineIndex={currentRoutineIndex}
                    />
                </Card>

                {/* AI Coach Card */}
                <AICoachCard
                    isGeneratingCoach={isGeneratingCoach}
                    coachMessage={coachMessage}
                    allAssignedLessonsCompleted={allAssignedLessonsCompleted}
                    completedLessonCount={completedLessonCount}
                    totalAssignedLessons={totalAssignedLessons}
                    nextLesson={nextLesson}
                    nextTopic={nextTopic}
                    currentDays={currentDays}
                    currentMinutes={currentMinutes}
                    lessonMinutes={lessonMinutes}
                    minUnit={minUnit}
                />

                {/* Study Settings Card */}
                <StudySettingsCard
                    currentMinutes={currentMinutes}
                    estimatedFinishLabel={estimatedFinishLabel}
                    onClick={() => setOpenSetting(true)}
                />
            </div>

            {/* Modals & Dialogs */}
            <DailyPlanModals
                openSetting={openSetting}
                setOpenSetting={setOpenSetting}
                openCareerAlert={openCareerAlert}
                setOpenCareerAlert={setOpenCareerAlert}
                openStudyTime={openStudyTime}
                setOpenStudyTime={setOpenStudyTime}
                openStudyTimeAlert={openStudyTimeAlert}
                setOpenStudyTimeAlert={setOpenStudyTimeAlert}
                currentMinutes={currentMinutes}
                newMinutes={newMinutes}
                setNewMinutes={setNewMinutes}
                currentDays={currentDays}
                projectedDays={projectedDays}
                isResetting={isResetting}
                resetError={resetError}
                clearResetError={clearResetError}
                resetCareerTrack={resetCareerTrack}
                isSavingStudyTime={isSavingStudyTime}
                setIsSavingStudyTime={setIsSavingStudyTime}
                studyTimeError={studyTimeError}
                setStudyTimeError={setStudyTimeError}
                onStudySettingsUpdated={handleStudySettingsUpdated}
            />
        </>
    );
}
