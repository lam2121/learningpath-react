import {
    BookOpen,
    ChevronDown,
    Brain,
    ChevronRight,
    CheckCircle2,
    RotateCcw,
    Settings,
    Sparkles,
    Target,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/common/context/AuthContext";
import {
    fetchCurrentUserProfile,
    updateStudySettings,
    generateAICoachMessage,
} from "@/feature/auth/api/authAPI";
import type { UserProfileResponse } from "@/feature/auth/type/Auth";
import { AlertDialog } from "@/shadcn/component/ui/alert-dialog";
import { Button } from "@/shadcn/component/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
import { Dialog } from "@/shadcn/component/ui/dialog";
import { Progress } from "@/shadcn/component/ui/progress";
import { useTranslation } from "react-i18next";
import type { RoadmapLesson, RoadmapTopic } from "@/feature/learning-path/api/roadmapApi";
import { isLessonReadyToStudy } from "@/feature/learning-path/lessonAccess";
import { getTrackedStudyMinutesByDay, calculateLongestStreak, getLoginDays } from "@/feature/user-profile/utils/StudyActivity";
import {
    getStudyMinutesForDate,
    getTodayDateKey,
    readStudyGoalDecision,
    type StudyGoalDecision,
} from "@/feature/user-profile/utils/dailyStudyGoal";
import { Link } from "@tanstack/react-router";

import { ChangeCareerAlert } from "./ChangeCareerAlert";
import { StudySettingsDialog } from "./StudySettingsDialog";
import { StudyTimeAlert } from "./StudyTimeAlert";
import { StudyTimeDialog } from "./StudyTimeDialog";
import { useCareerTrackReset } from "@/feature/user-profile/hook/useCareerTrackReset";

const LOCKED_COPY = "Complete your first lesson to unlock this feature.";
const SHARED_CARD_CLASS =
    "border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)]";
const profileDateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
});

function formatLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatMinutes(minutes: number | null | undefined) {
    if (minutes == null || minutes <= 0) {
        return "Estimate pending";
    }
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

function formatProgressMinutes(minutes: number) {
    if (minutes <= 0) {
        return "0 min";
    }

    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
}

function estimateDays(totalMinutes: number, dailyStudyMinutes: number) {
    if (totalMinutes <= 0 || dailyStudyMinutes <= 0) {
        return null;
    }
    return Math.max(1, Math.ceil(totalMinutes / dailyStudyMinutes));
}

function formatProfileDate(value: string | null | undefined) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return profileDateFormatter.format(parsed);
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
    const { t } = useTranslation("profile");
    const { user } = useAuth();
    const userId = Number(user?.id);
    const [isStudyPlanExpanded, setIsStudyPlanExpanded] = useState(false);
    const [openSetting, setOpenSetting] = useState(false);
    const [openStudyTime, setOpenStudyTime] = useState(false);
    const [openCareerAlert, setOpenCareerAlert] = useState(false);
    const [openStudyTimeAlert, setOpenStudyTimeAlert] = useState(false);
    const [currentHour, setCurrentHour] = useState(2);
    const [newHour, setNewHour] = useState(2);
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
                const hours = Math.max(1, Math.round(profile.daily_study_minutes / 60));
                setProfile(profile);
                setCurrentHour(hours);
                setNewHour(hours);
                setTotalEstimatedMinutes(profile.total_estimated_minutes);
            } catch {
                if (!isMounted) {
                    return;
                }
                setCurrentHour(2);
                setNewHour(2);
                setTotalEstimatedMinutes(0);
            }
        };

        void loadProfile();

        const handleProfileUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<UserProfileResponse>;
            if (!isMounted) {
                return;
            }
            const hours = Math.max(1, Math.round(customEvent.detail.daily_study_minutes / 60));
            setProfile(customEvent.detail);
            setCurrentHour(hours);
            setNewHour(hours);
            setTotalEstimatedMinutes(customEvent.detail.total_estimated_minutes);
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
                const validScores = history.filter((item) => typeof item.best_score_percent === 'number' && item.best_score_percent > 0);
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
    const lessonLabel = allAssignedLessonsCompleted
        ? "Review Learning Path"
        : isLessonReadyToStudy(nextLesson)
            ? "Start Learning"
            : "View Learning Path";
    const lessonDescription = nextLesson
        ? `${nextLesson.title} · ${formatLabel(nextLesson.difficulty_tier)} · ${formatMinutes(nextLesson.estimated_minutes)}`
        : allAssignedLessonsCompleted
            ? `All ${totalAssignedLessons} assigned lessons have a passed quiz result.`
            : "Your next lesson will appear here once your roadmap is ready.";
    const lessonOutcome = nextLesson && nextTopic
        ? `Learn the language patterns needed for ${nextTopic.name} and keep your roadmap moving forward.`
        : allAssignedLessonsCompleted
            ? "You have finished every assigned lesson quiz in this roadmap. Review previous lessons or continue from the learning path if new content appears."
            : "Open your learning path to see your assigned topics and recommended lesson order.";
    const currentDays = estimateDays(totalEstimatedMinutes, currentHour * 60);
    const projectedDays = estimateDays(totalEstimatedMinutes, newHour * 60);
    const lessonMinutes = nextLesson?.estimated_minutes ?? 0;
    const backendStudiedTodayMinutes = getStudyMinutesForDate(
        profile?.study_history,
        todayDateKey,
    );
    const trackedStudiedTodayMinutes = trackedStudyMinutesByDay[todayDateKey] ?? 0;
    const todayLearnedMinutes = backendStudiedTodayMinutes + trackedStudiedTodayMinutes;
    const dailyStudyMinutes = currentHour * 60;
    const timeBudgetUsage =
        dailyStudyMinutes > 0
            ? Math.min(100, Math.round((todayLearnedMinutes / dailyStudyMinutes) * 100))
            : 0;
    const remainingTodayMinutes = Math.max(0, dailyStudyMinutes - todayLearnedMinutes);
    const bonusTodayMinutes = Math.max(0, todayLearnedMinutes - dailyStudyMinutes);
    const hasMetTodayGoal = dailyStudyMinutes > 0 && todayLearnedMinutes >= dailyStudyMinutes;
    const estimatedFinishLabel = formatProfileDate(profile?.estimated_finish);
    const budgetCardClass = hasMetTodayGoal
        ? "rounded-3xl border border-emerald-200 bg-[linear-gradient(135deg,_rgba(236,253,245,1)_0%,_rgba(240,249,255,1)_52%,_rgba(219,234,254,1)_100%)] p-4 shadow-[0_18px_45px_rgba(16,185,129,0.12)] ring-1 ring-emerald-100"
        : "space-y-2";

    const handleStudySettingsUpdated = (profile: UserProfileResponse) => {
        const hours = Math.max(1, Math.round(profile.daily_study_minutes / 60));
        setProfile(profile);
        setCurrentHour(hours);
        setNewHour(hours);
        setTotalEstimatedMinutes(profile.total_estimated_minutes);
        window.dispatchEvent(
            new CustomEvent<UserProfileResponse>("careerpath:profile-updated", {
                detail: profile,
            }),
        );
    };

    return (
        <>
            <div className="flex w-full flex-col gap-5">
                <Card className={`${SHARED_CARD_CLASS} overflow-hidden border-l-4 border-l-blue-600`}>
                    <button
                        type="button"
                        onClick={() => setIsStudyPlanExpanded((current) => !current)}
                        aria-expanded={isStudyPlanExpanded}
                        className="w-full text-left"
                    >
                        <CardHeader className="space-y-5 pb-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-blue-700">
                                        {t("dailyPlan", { defaultValue: "Today's Study Plan" })}
                                    </p>
                                    <CardTitle className="text-3xl font-bold tracking-tight text-slate-950">
                                        {allAssignedLessonsCompleted
                                            ? "Today's lessons are done"
                                            : nextLesson
                                                ? `Start with ${nextLesson.title}`
                                                : hasRoadmap
                                                    ? "Your roadmap is ready to explore"
                                                    : "Your roadmap is being prepared"}
                                    </CardTitle>
                                    <p className="text-base leading-7 text-slate-500">
                                        {allAssignedLessonsCompleted
                                            ? `You have already passed ${completedLessonCount} of ${totalAssignedLessons} assigned lesson quizzes.`
                                            : nextLesson && nextTopic
                                                ? `Your main focus today is Topic ${nextTopic.sort_order}: ${nextTopic.name}. This lesson is the clearest next action for your track.`
                                                : hasRoadmap
                                                    ? "Open your learning path to see the clearest next lesson and roadmap order for your track."
                                                    : "Open your learning path once your assigned roadmap is available."}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="rounded-2xl bg-blue-50 p-3">
                                        <Target className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="rounded-2xl bg-slate-100 p-2.5">
                                        <ChevronDown
                                            className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${isStudyPlanExpanded ? "rotate-180" : ""
                                                }`}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={budgetCardClass}>
                                <div className="flex items-center justify-between text-base text-slate-500">
                                    <span className={hasMetTodayGoal ? "font-semibold text-emerald-700" : ""}>
                                        {t("todayTimeBudget", { defaultValue: "Today's time budget" })}
                                    </span>
                                    <span className={`font-semibold ${hasMetTodayGoal ? "text-emerald-700" : "text-slate-900"}`}>
                                        {formatProgressMinutes(todayLearnedMinutes)} of {currentHour}h
                                    </span>
                                </div>
                                {hasMetTodayGoal ? (
                                    <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                                        <CheckCircle2 className="h-4 w-4" />
                                        {t("dailyGoalReached", { defaultValue: "Daily goal reached" })}
                                    </div>
                                ) : null}
                                <Progress
                                    value={timeBudgetUsage}
                                    className="h-2.5 bg-slate-100"
                                    indicatorClassName={hasMetTodayGoal ? "bg-emerald-500" : "bg-blue-600"}
                                />
                                <div className="grid gap-3 pt-1 sm:grid-cols-3">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            {t("plannedToday", { defaultValue: "Planned Today" })}
                                        </p>
                                        <p className="mt-1 text-base font-bold text-slate-900">
                                            {currentHour}h
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            {t("learnedToday", { defaultValue: "Learned Today" })}
                                        </p>
                                        <p className="mt-1 text-base font-bold text-slate-900">
                                            {formatProgressMinutes(todayLearnedMinutes)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            {hasMetTodayGoal ? t("bonusTime", { defaultValue: "Bonus Time" }) : t("remaining", { defaultValue: "Remaining" })}
                                        </p>
                                        <p className="mt-1 text-base font-bold text-slate-900">
                                            {hasMetTodayGoal
                                                ? formatProgressMinutes(bonusTodayMinutes)
                                                : formatProgressMinutes(remainingTodayMinutes)}
                                        </p>
                                    </div>
                                </div>
                                <p className="pt-1 text-base text-slate-500">
                                    {hasMetTodayGoal
                                        ? "You have already reached the study time you planned for today."
                                        : remainingTodayMinutes > 0
                                            ? `${formatProgressMinutes(remainingTodayMinutes)} left to hit today's goal.`
                                            : "Your daily study target will update here as you learn."}
                                </p>
                                <p className="pt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                                    {isStudyPlanExpanded
                                        ? "Hide today's actions"
                                        : "Click to view today's actions"}
                                </p>
                            </div>
                        </CardHeader>
                    </button>

                    {hasMetTodayGoal ? (
                        <div className="border-t border-emerald-100 bg-[linear-gradient(135deg,_rgba(236,253,245,1)_0%,_rgba(239,246,255,1)_100%)] px-5 py-4">
                            <div className="rounded-[24px] border border-emerald-200 bg-white px-4 py-4 text-sm text-slate-700 shadow-[0_16px_36px_rgba(16,185,129,0.12)] ring-1 ring-emerald-100">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-2xl bg-emerald-100 p-2.5">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                                            Goal reached
                                        </p>
                                        <p className="font-semibold text-slate-900">
                                            {studyGoalDecision === "break"
                                                ? "Great stopping point for today."
                                                : studyGoalDecision === "continue"
                                                    ? "Extra study time counts as bonus progress."
                                                    : "You finished today's planned study time."}
                                        </p>
                                        <p className="mt-1 leading-6 text-slate-600">
                                            {studyGoalDecision === "break"
                                                ? "Take a break and come back tomorrow with a fresh start."
                                                : studyGoalDecision === "continue"
                                                    ? "Keep going if you still have energy. Everything beyond today's goal is extra momentum."
                                                    : "If you continue learning in a lesson, the app will ask whether you want to stop for today or keep going."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {isStudyPlanExpanded ? (
                        <CardContent className="border-t border-slate-200 bg-slate-50/70 p-5">
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-[0_10px_30px_rgba(37,99,235,0.08)]">
                                    <div className="flex items-start gap-4">
                                        <div className="rounded-2xl bg-blue-50 p-3 shadow-sm">
                                            <BookOpen className="h-5 w-5 text-blue-600" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-lg font-semibold text-slate-900">{t("newLesson", { defaultValue: "New Lesson" })}</h3>
                                            <p className="mt-1 text-base text-slate-700">
                                                {lessonDescription}
                                            </p>
                                            <p className="mt-2 text-base leading-7 text-slate-500">
                                                {lessonOutcome}
                                            </p>
                                            {allAssignedLessonsCompleted ? (
                                                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                                                        {completedLessonCount} lessons done
                                                    </span>
                                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                                                        All assigned quizzes passed
                                                    </span>
                                                </div>
                                            ) : nextLesson && nextTopic ? (
                                                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                                                        Topic {nextTopic.sort_order}
                                                    </span>
                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                                        {formatLabel(nextLesson.primary_skill)}
                                                    </span>
                                                    {remainingTodayMinutes > 0 ? (
                                                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                                                            {formatProgressMinutes(remainingTodayMinutes)} left in today's goal
                                                        </span>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    <Button asChild className="mt-5 h-11 w-full bg-blue-600 hover:bg-blue-700">
                                        <Link
                                            to={isLessonReadyToStudy(nextLesson) ? "/lessons/$lessonId" : "/lessons/learning-path"}
                                            params={isLessonReadyToStudy(nextLesson) ? { lessonId: String(nextLesson!.id) } : undefined}
                                        >
                                            {lessonLabel}
                                        </Link>
                                    </Button>
                                </div>

                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="rounded-2xl bg-slate-100 p-3 shadow-sm">
                                                <RotateCcw className="h-5 w-5 text-slate-500" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-lg font-semibold text-slate-900">{t("review", { defaultValue: "Review" })}</h3>
                                                <p className="mt-1 text-base text-slate-700">
                                                    {nextTopic
                                                        ? `Review for ${nextTopic.name} will appear here after you complete lessons and quizzes in this topic.`
                                                        : "Review cards and follow-up practice will appear here once your roadmap is active."}
                                                </p>
                                                <p className="mt-2 text-base leading-7 text-slate-500">
                                                    {allAssignedLessonsCompleted
                                                        ? "You can now revisit completed lessons and quizzes to reinforce retention."
                                                        : nextLesson
                                                            ? `Finish ${nextLesson.title} and submit its quiz to unlock targeted review items.`
                                                            : LOCKED_COPY}
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            disabled
                                            className="mt-5 h-11 w-full border-slate-200 text-slate-500"
                                        >
                                            {allAssignedLessonsCompleted
                                                ? "Review unlocked"
                                                : "Complete a lesson first"}
                                        </Button>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="rounded-2xl bg-slate-100 p-3 shadow-sm">
                                                <Brain className="h-5 w-5 text-slate-500" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-lg font-semibold text-slate-900">Flashcards</h3>
                                                <p className="mt-1 text-base text-slate-700">
                                                    {allAssignedLessonsCompleted
                                                        ? "Flashcards can now be generated from the lessons you have already completed."
                                                        : nextLesson
                                                            ? `Flashcards will be generated from the vocabulary and patterns inside ${nextLesson.title}.`
                                                            : "Vocabulary flashcards will be generated from completed lessons."}
                                                </p>
                                                <p className="mt-2 text-base leading-7 text-slate-500">
                                                    {allAssignedLessonsCompleted
                                                        ? "Use completed lessons as review material while you wait for the next roadmap action."
                                                        : nextTopic
                                                            ? `Your first deck unlocks after you finish a lesson in ${nextTopic.name}.`
                                                            : LOCKED_COPY}
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            disabled
                                            className="mt-5 h-11 w-full border-slate-200 text-slate-500"
                                        >
                                            {allAssignedLessonsCompleted
                                                ? "Ready from completed lessons"
                                                : "Unlock after your first quiz"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    ) : null}
                </Card>

                <Card className="border border-blue-200 bg-[linear-gradient(135deg,_rgba(239,246,255,1)_0%,_rgba(224,242,254,0.98)_55%,_rgba(255,255,255,1)_100%)] shadow-[0_18px_45px_rgba(37,99,235,0.14)] ring-1 ring-blue-100">
                    <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-blue-100">
                                <Sparkles className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-lg font-semibold text-slate-900">AI Coach</h3>
                                    <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                                        Personal Guidance
                                    </span>
                                </div>
                                <p className="mt-2 text-base leading-7 text-slate-700">
                                    {isGeneratingCoach ? "AI Coach is analyzing your progress..." : coachMessage ? coachMessage : (
                                        allAssignedLessonsCompleted
                                            ? `You have completed ${completedLessonCount} of ${totalAssignedLessons} assigned lessons. Use today to review and consolidate what you passed.`
                                            : nextLesson && currentDays
                                                ? `At ${currentHour} hour${currentHour === 1 ? "" : "s"} per day, completing ${nextLesson.title} keeps you on pace to finish in about ${currentDays} day${currentDays === 1 ? "" : "s"}.`
                                                : "Start with your next lesson first. Once you finish a quiz, AI Coach can suggest exactly what to review next."
                                    )}
                                </p>
                                {allAssignedLessonsCompleted ? (
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                                        <span className="rounded-full bg-white px-2.5 py-1 text-emerald-700 ring-1 ring-emerald-100">
                                            Roadmap progress saved
                                        </span>
                                        <span className="rounded-full bg-white px-2.5 py-1 text-slate-700 ring-1 ring-slate-200">
                                            {completedLessonCount}/{totalAssignedLessons} lessons passed
                                        </span>
                                    </div>
                                ) : nextLesson && nextTopic ? (
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                                        <span className="rounded-full bg-white px-2.5 py-1 text-blue-700 ring-1 ring-blue-100">
                                            Focus: {nextTopic.name}
                                        </span>
                                        <span className="rounded-full bg-white px-2.5 py-1 text-slate-700 ring-1 ring-slate-200">
                                            Next: {formatMinutes(lessonMinutes)}
                                        </span>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    onClick={() => setOpenSetting(true)}
                    className="cursor-pointer border border-emerald-200 bg-[linear-gradient(135deg,_rgba(236,253,245,1)_0%,_rgba(240,249,255,0.96)_100%)] shadow-[0_18px_45px_rgba(16,185,129,0.12)] ring-1 ring-emerald-100 transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(16,185,129,0.16)]"
                >
                    <CardContent className="flex min-h-[72px] items-center justify-between gap-4 p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-emerald-100">
                                <Settings className="h-5 w-5 text-emerald-600" />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-lg font-semibold text-slate-900">{t("studySettings", { defaultValue: "Study Settings" })}</p>
                                    <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                                        {t("changeTrack", { defaultValue: "Change Career" })}
                                    </span>
                                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 ring-1 ring-emerald-100">
                                        {t("studyTime", { defaultValue: "Study Time" })}
                                    </span>
                                </div>
                                <p className="mt-1 text-base text-slate-700">
                                    {currentHour}h / {t("day", { defaultValue: "day" })}
                                    {estimatedFinishLabel ? ` · ${t("finishBy", { date: estimatedFinishLabel, defaultValue: `Finish by ${estimatedFinishLabel}` })}` : ""}
                                </p>
                                <p className="mt-1 text-base text-slate-500">
                                    {t("studySettingsCardDesc", { defaultValue: "Open settings to change career direction or update your daily study time." })}
                                </p>
                            </div>
                        </div>

                        <ChevronRight className="h-5 w-5 shrink-0 text-emerald-600" />
                    </CardContent>
                </Card>

            </div>

            <Dialog open={openSetting} onOpenChange={setOpenSetting}>
                <StudySettingsDialog
                    studyHours={currentHour}
                    onCareerClick={() => {
                        setOpenSetting(false);
                        clearResetError();
                        setOpenCareerAlert(true);
                    }}
                    onStudyTimeClick={() => {
                        setOpenSetting(false);
                        setStudyTimeError(null);
                        setOpenStudyTime(true);
                    }}
                />
            </Dialog>

            <AlertDialog
                open={openCareerAlert}
                onOpenChange={(open) => {
                    if (isResetting) {
                        return;
                    }
                    if (!open) {
                        clearResetError();
                    }
                    setOpenCareerAlert(open);
                }}
            >
                <ChangeCareerAlert
                    onCancel={() => {
                        clearResetError();
                        setOpenCareerAlert(false);
                    }}
                    onConfirm={async () => {
                        const didReset = await resetCareerTrack();
                        if (didReset) {
                            setOpenCareerAlert(false);
                        }
                    }}
                    isSubmitting={isResetting}
                    errorMessage={resetError}
                />
            </AlertDialog>

            <Dialog open={openStudyTime} onOpenChange={setOpenStudyTime}>
                <StudyTimeDialog
                    currentHour={currentHour}
                    onCancel={() => setOpenStudyTime(false)}
                    onSave={(hour) => {
                        setOpenStudyTime(false);
                        setNewHour(hour);
                        setStudyTimeError(null);
                        setOpenStudyTimeAlert(true);
                    }}
                />
            </Dialog>

            <AlertDialog open={openStudyTimeAlert} onOpenChange={setOpenStudyTimeAlert}>
                <StudyTimeAlert
                    currentHour={currentHour}
                    newHour={newHour}
                    currentDays={currentDays}
                    newDays={projectedDays}
                    isSaving={isSavingStudyTime}
                    errorMessage={studyTimeError}
                    onCancel={() => setOpenStudyTimeAlert(false)}
                    onConfirm={async () => {
                        setIsSavingStudyTime(true);
                        setStudyTimeError(null);
                        try {
                            const updatedProfile = await updateStudySettings({
                                daily_study_minutes: newHour * 60,
                            });
                            handleStudySettingsUpdated(updatedProfile);
                            setOpenStudyTimeAlert(false);
                        } catch {
                            setStudyTimeError(
                                "Could not update daily study time. Please try again.",
                            );
                        } finally {
                            setIsSavingStudyTime(false);
                        }
                    }}
                />
            </AlertDialog>
        </>
    );
}
