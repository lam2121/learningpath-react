import {
    BookOpen,
    ChevronDown,
    Brain,
    ChevronRight,
    RotateCcw,
    Settings,
    Sparkles,
    Target,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import {
    fetchCurrentUserProfile,
    updateStudySettings,
} from "@/feature/auth/api/authAPI";
import type { UserProfileResponse } from "@/feature/auth/type/Auth";
import { AlertDialog } from "@/shadcn/component/ui/alert-dialog";
import { Button } from "@/shadcn/component/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
import { Dialog } from "@/shadcn/component/ui/dialog";
import { Progress } from "@/shadcn/component/ui/progress";
import type { RoadmapLesson, RoadmapTopic } from "@/feature/learning-path/roadmapApi";

import { ChangeCareerAlert } from "./ChangeCareerAlert";
import { StudySettingsDialog } from "./StudySettingsDialog";
import { StudyTimeAlert } from "./StudyTimeAlert";
import { StudyTimeDialog } from "./StudyTimeDialog";

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
    onStudyPlanExpandedChange?: (expanded: boolean) => void;
};

export function DailyPlanView({
    nextTopic,
    nextLesson,
    onStudyPlanExpandedChange,
}: DailyPlanViewProps) {
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

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        onStudyPlanExpandedChange?.(isStudyPlanExpanded);
    }, [isStudyPlanExpanded, onStudyPlanExpandedChange]);

    const lessonHref = nextLesson?.is_generated
        ? `/lessons/${nextLesson.id}`
        : "/lessons/learning-path";
    const lessonLabel = nextLesson?.is_generated ? "Start Learning" : "View Learning Path";
    const lessonDescription = nextLesson
        ? `${nextLesson.title} · ${formatLabel(nextLesson.difficulty_tier)} · ${formatMinutes(nextLesson.estimated_minutes)}`
        : "Your next lesson will appear here once your roadmap is ready.";
    const lessonOutcome = nextLesson && nextTopic
        ? `Learn the language patterns needed for ${nextTopic.name} and keep your roadmap moving forward.`
        : "Open your learning path to see your assigned topics and recommended lesson order.";
    const currentDays = estimateDays(totalEstimatedMinutes, currentHour * 60);
    const projectedDays = estimateDays(totalEstimatedMinutes, newHour * 60);
    const lessonMinutes = nextLesson?.estimated_minutes ?? 0;
    const dailyStudyMinutes = currentHour * 60;
    const timeBudgetUsage =
        lessonMinutes > 0 && dailyStudyMinutes > 0
            ? Math.min(100, Math.round((lessonMinutes / dailyStudyMinutes) * 100))
            : 0;
    const remainingTodayMinutes =
        lessonMinutes > 0 && dailyStudyMinutes > lessonMinutes
            ? dailyStudyMinutes - lessonMinutes
            : 0;
    const estimatedFinishLabel = formatProfileDate(profile?.estimated_finish);

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
                                        Today's Study Plan
                                    </p>
                                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-950">
                                        {nextLesson
                                            ? `Start with ${nextLesson.title}`
                                            : "Your roadmap is ready to explore"}
                                    </CardTitle>
                                    <p className="text-sm leading-6 text-slate-500">
                                        {nextLesson && nextTopic
                                            ? `Your main focus today is Topic ${nextTopic.sort_order}: ${nextTopic.name}. This lesson is the clearest next action for your track.`
                                            : "Open your learning path to see the clearest next lesson and roadmap order for your track."}
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

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm text-slate-500">
                                    <span>Today's time budget</span>
                                    <span className="font-semibold text-slate-900">
                                        {lessonMinutes > 0
                                            ? `${timeBudgetUsage}% of ${currentHour}h`
                                            : `${currentHour}h planned`}
                                    </span>
                                </div>
                                <Progress
                                    value={timeBudgetUsage}
                                    className="h-2.5 bg-slate-100"
                                    indicatorClassName="bg-blue-600"
                                />
                                <div className="grid gap-3 pt-1 sm:grid-cols-3">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Planned Today
                                        </p>
                                        <p className="mt-1 text-sm font-bold text-slate-900">
                                            {currentHour}h
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            This Lesson
                                        </p>
                                        <p className="mt-1 text-sm font-bold text-slate-900">
                                            {formatMinutes(lessonMinutes)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Estimated Finish
                                        </p>
                                        <p className="mt-1 text-sm font-bold text-slate-900">
                                            {estimatedFinishLabel ?? "Estimate pending"}
                                        </p>
                                    </div>
                                </div>
                                <p className="pt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                                    {isStudyPlanExpanded
                                        ? "Hide today's actions"
                                        : "Click to view today's actions"}
                                </p>
                            </div>
                        </CardHeader>
                    </button>

                    {isStudyPlanExpanded ? (
                        <CardContent className="border-t border-slate-200 bg-slate-50/70 p-5">
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-[0_10px_30px_rgba(37,99,235,0.08)]">
                                    <div className="flex items-start gap-4">
                                        <div className="rounded-2xl bg-blue-50 p-3 shadow-sm">
                                            <BookOpen className="h-5 w-5 text-blue-600" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-slate-900">New Lesson</h3>
                                            <p className="mt-1 text-sm text-slate-700">
                                                {lessonDescription}
                                            </p>
                                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                                {lessonOutcome}
                                            </p>
                                            {nextLesson && nextTopic ? (
                                                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                                                        Topic {nextTopic.sort_order}
                                                    </span>
                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                                        {formatLabel(nextLesson.primary_skill)}
                                                    </span>
                                                    {remainingTodayMinutes > 0 ? (
                                                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                                                            {formatMinutes(remainingTodayMinutes)} left after this
                                                        </span>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    <Button asChild className="mt-5 h-11 w-full bg-blue-600 hover:bg-blue-700">
                                        <a href={lessonHref}>{lessonLabel}</a>
                                    </Button>
                                </div>

                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="rounded-2xl bg-slate-100 p-3 shadow-sm">
                                                <RotateCcw className="h-5 w-5 text-slate-500" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-slate-900">Review</h3>
                                                <p className="mt-1 text-sm text-slate-700">
                                                    {nextTopic
                                                        ? `Review for ${nextTopic.name} will appear here after you complete lessons and quizzes in this topic.`
                                                        : "Review cards and follow-up practice will appear here once your roadmap is active."}
                                                </p>
                                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                                    {nextLesson
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
                                            Complete a lesson first
                                        </Button>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="rounded-2xl bg-slate-100 p-3 shadow-sm">
                                                <Brain className="h-5 w-5 text-slate-500" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-slate-900">Flashcards</h3>
                                                <p className="mt-1 text-sm text-slate-700">
                                                    {nextLesson
                                                        ? `Flashcards will be generated from the vocabulary and patterns inside ${nextLesson.title}.`
                                                        : "Vocabulary flashcards will be generated from completed lessons."}
                                                </p>
                                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                                    {nextTopic
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
                                            Unlock after your first quiz
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
                                    <h3 className="font-semibold text-slate-900">AI Coach</h3>
                                    <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                                        Personal Guidance
                                    </span>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-700">
                                    {nextLesson && currentDays
                                        ? `At ${currentHour} hour${currentHour === 1 ? "" : "s"} per day, completing ${nextLesson.title} keeps you on pace to finish in about ${currentDays} day${currentDays === 1 ? "" : "s"}.`
                                        : "Start with your next lesson first. Once you finish a quiz, AI Coach can suggest exactly what to review next."}
                                </p>
                                {nextLesson && nextTopic ? (
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
                                    <p className="font-semibold text-slate-900">Study Settings</p>
                                    <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                                        Change Career
                                    </span>
                                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 ring-1 ring-emerald-100">
                                        Study Time
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-slate-700">
                                    {currentHour}h/day
                                    {estimatedFinishLabel ? ` · Finish by ${estimatedFinishLabel}` : ""}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Open settings to change career direction or update your daily study time.
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
                        setOpenCareerAlert(true);
                    }}
                    onStudyTimeClick={() => {
                        setOpenSetting(false);
                        setStudyTimeError(null);
                        setOpenStudyTime(true);
                    }}
                />
            </Dialog>

            <AlertDialog open={openCareerAlert} onOpenChange={setOpenCareerAlert}>
                <ChangeCareerAlert
                    onCancel={() => setOpenCareerAlert(false)}
                    onConfirm={() => {
                        setOpenCareerAlert(false);
                    }}
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