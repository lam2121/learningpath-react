import { ArrowRight, BookOpen, Brain, Clock, RotateCcw, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/shadcn/component/ui/button";
import { CardContent } from "@/shadcn/component/ui/card";
import type { RoadmapLesson, RoadmapTopic } from "@/feature/learning-path/api/roadmapApi";
import { isLessonReadyToStudy } from "@/feature/learning-path/lessonAccess";
import { userProfileTexts } from "@/feature/user-profile/userProfileTexts";
import { formatProgressMinutes } from "../utils/dailyPlanFormatters";

const LOCKED_COPY = "Complete your first lesson to unlock this feature.";

function formatLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

interface DailyActionsListProps {
    nextLesson: RoadmapLesson | null;
    nextTopic: RoadmapTopic | null;
    allAssignedLessonsCompleted: boolean;
    completedLessonCount: number;
    lessonLabel: string;
    lessonDescription: string;
    lessonOutcome: string;
    minUnit: string;
    remainingTodayMinutes: number;
    reviewCount: number;
    savedFlashcardsCount: number | null;
    isStudyPlanExpanded: boolean;
    activeRoutineIndex?: number;
}

export function DailyActionsList({
    nextLesson,
    nextTopic,
    allAssignedLessonsCompleted,
    completedLessonCount,
    lessonLabel,
    lessonDescription,
    lessonOutcome,
    minUnit,
    remainingTodayMinutes,
    reviewCount,
    savedFlashcardsCount,
    isStudyPlanExpanded,
    activeRoutineIndex,
}: DailyActionsListProps) {
    const { t } = useTranslation("profile");

    return (
        <div className="accordion-collapse-grid" data-expanded={isStudyPlanExpanded}>
            <div>
                <CardContent className="border-t border-slate-300 bg-slate-50/50 p-6 sm:p-7 dark:border-slate-700 dark:bg-slate-900/60">
                    <div className="space-y-5 accordion-collapse-content">
                        {/* New Lesson Card */}
                        <Link
                            to={isLessonReadyToStudy(nextLesson) ? "/lessons/$lessonId" : "/lessons/learning-path"}
                            params={isLessonReadyToStudy(nextLesson) ? { lessonId: String(nextLesson!.id) } : undefined}
                            className={`daily-action-card group relative block overflow-hidden rounded-3xl border bg-white p-5 sm:p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg cursor-pointer dark:bg-slate-900 ${
                                activeRoutineIndex === 0
                                    ? "border-blue-500 ring-2 ring-blue-500/40 shadow-[0_12px_36px_rgba(37,99,235,0.18)] -translate-y-0.5"
                                    : "border-blue-300 dark:border-blue-700"
                            }`}
                        >
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 opacity-90" />

                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-500/20 transition-transform duration-300 group-hover:scale-105">
                                    <BookOpen className="h-6 w-6" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-lg font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors dark:text-white dark:group-hover:text-blue-400">
                                            {t("newLesson", { defaultValue: "New Lesson" })}
                                        </h3>
                                        <span className="rounded-full bg-blue-100/80 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                            {nextTopic
                                                ? t("topicWithOrder", { order: nextTopic.sort_order, defaultValue: `Topic ${nextTopic.sort_order}` })
                                                : t("nextUp", { defaultValue: "Next Up" })}
                                        </span>
                                        {nextTopic ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/90 bg-indigo-50/95 px-2.5 py-0.5 text-xs font-bold text-slate-900 shadow-2xs dark:border-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-100">
                                                <span className="text-[11px] font-extrabold uppercase text-indigo-700 dark:text-indigo-400">
                                                    {t("topicLabelPrefix", { defaultValue: "Topic:" })}
                                                </span>
                                                <span>{nextTopic.name}</span>
                                            </span>
                                        ) : null}
                                    </div>

                                    <p className="mt-1 text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">
                                        {lessonDescription}
                                    </p>
                                    <p className="mt-1.5 text-xs sm:text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                                        {lessonOutcome}
                                    </p>

                                    {allAssignedLessonsCompleted ? (
                                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                                            <span className="rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                {t("lessonsDoneCount", {
                                                    count: completedLessonCount,
                                                    defaultValue: `${completedLessonCount} lessons done`,
                                                })}
                                            </span>
                                            <span className="rounded-full border border-blue-200/80 bg-blue-50/80 px-2.5 py-1 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                                                {t("allAssignedQuizzesPassedBadge", {
                                                    defaultValue: "All assigned quizzes passed",
                                                })}
                                            </span>
                                        </div>
                                    ) : nextLesson && nextTopic ? (
                                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                                            <span className="rounded-full border border-blue-200/80 bg-blue-50/80 px-2.5 py-1 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                                                {t("topicWithOrder", {
                                                    order: nextTopic.sort_order,
                                                    defaultValue: `Topic ${nextTopic.sort_order}`,
                                                })}
                                            </span>
                                            <span className="rounded-full border border-indigo-200/80 bg-indigo-50/80 px-2.5 py-1 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                                                {t("topicLabelPrefix", { defaultValue: "Topic:" })} {nextTopic.name}
                                            </span>
                                            <span className="rounded-full border border-slate-200/80 bg-slate-100/80 px-2.5 py-1 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {formatLabel(nextLesson.primary_skill)}
                                            </span>
                                            {remainingTodayMinutes > 0 ? (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                    <Clock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                                    {t("timeLeftInTodayGoal", {
                                                        time: formatProgressMinutes(remainingTodayMinutes, minUnit),
                                                        defaultValue: `${formatProgressMinutes(
                                                            remainingTodayMinutes,
                                                            minUnit,
                                                        )} left in today's goal`,
                                                    })}
                                                </span>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <Button
                                type="button"
                                className="mt-5 h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white text-base font-bold shadow-md shadow-blue-500/25 transition-all duration-200 group-hover:scale-[1.01] group-hover:shadow-lg group-hover:shadow-blue-500/35 pointer-events-none"
                            >
                                <span>{lessonLabel}</span>
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                            </Button>
                        </Link>

                        {/* Review & Flashcards Row */}
                        <div className="grid gap-4 lg:grid-cols-2">
                            {/* Review Card */}
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                    if (reviewCount > 0) window.dispatchEvent(new CustomEvent("careerpath:open-daily-review"));
                                }}
                                onKeyDown={(e) => {
                                    if ((e.key === "Enter" || e.key === " ") && reviewCount > 0) {
                                        e.preventDefault();
                                        window.dispatchEvent(new CustomEvent("careerpath:open-daily-review"));
                                    }
                                }}
                                className={`daily-action-card group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-5 sm:p-6 shadow-xs transition-all duration-300 ${
                                    activeRoutineIndex === 1
                                        ? "border-amber-500 ring-2 ring-amber-500/40 shadow-[0_12px_36px_rgba(245,158,11,0.18)] -translate-y-0.5 bg-white dark:bg-slate-900"
                                        : reviewCount > 0
                                            ? "border-amber-300 bg-white hover:-translate-y-1 hover:border-amber-400 hover:shadow-lg cursor-pointer dark:border-amber-700 dark:bg-slate-900"
                                            : "border-slate-300 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/60"
                                }`}
                            >
                                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-90" />

                                <div className="flex items-start gap-4">
                                    <div
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-md transition-transform duration-300 group-hover:scale-105 ${
                                            reviewCount > 0 || activeRoutineIndex === 1
                                                ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-500/20"
                                                : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                                        }`}
                                    >
                                        <RotateCcw className="h-6 w-6" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3
                                                className={`text-lg font-black tracking-tight text-slate-900 transition-colors dark:text-white ${
                                                    reviewCount > 0 || activeRoutineIndex === 1
                                                        ? "text-amber-600 dark:text-amber-400"
                                                        : ""
                                                }`}
                                            >
                                                {t("review", { defaultValue: "Review" })}
                                            </h3>
                                            {reviewCount > 0 ? (
                                                <span className="rounded-full bg-amber-100/90 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                    {t("itemsToReview", {
                                                        count: reviewCount,
                                                        defaultValue: `${reviewCount} to review`,
                                                    })}
                                                </span>
                                            ) : null}
                                        </div>

                                        <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            {reviewCount > 0
                                                ? t("reviewQuestionsCountDesc", {
                                                    count: reviewCount,
                                                    defaultValue: `You have ${reviewCount} question(s) from previous lesson quizzes to review.`,
                                                })
                                                : completedLessonCount > 0
                                                    ? t("allCaughtUpDesc", {
                                                        defaultValue:
                                                            "All caught up! No wrong lesson quiz answers waiting for review.",
                                                    })
                                                    : t("reviewQuestionsAppearHere", {
                                                        defaultValue:
                                                            "Review questions will appear here after you complete lesson quizzes.",
                                                    })}
                                        </p>
                                        <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                                            {reviewCount > 0
                                                ? t("practiceMistakesDesc", {
                                                    defaultValue:
                                                        "Practice your past mistakes now to reinforce your understanding and clear them from your review pool.",
                                                })
                                                : completedLessonCount > 0
                                                    ? t("greatRetentionDesc", {
                                                        defaultValue:
                                                            "Great retention! Questions you miss on future quizzes will be saved here for daily morning review.",
                                                    })
                                                    : t("lockedFeatureDesc", { defaultValue: LOCKED_COPY })}
                                        </p>
                                    </div>
                                </div>

                                {reviewCount > 0 ? (
                                    <Button
                                        type="button"
                                        className="mt-5 h-11 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm sm:text-base font-bold shadow-md shadow-orange-500/25 transition-all duration-200 group-hover:scale-[1.01] pointer-events-none"
                                    >
                                        <span>
                                            {t("startReviewWithCount", {
                                                count: Math.min(5, reviewCount),
                                                defaultValue: `Start Review (${Math.min(5, reviewCount)} questions)`,
                                            })}
                                        </span>
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        disabled
                                        className="mt-5 h-11 w-full rounded-2xl border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500"
                                    >
                                        {completedLessonCount > 0
                                            ? t("allCaughtUp", { defaultValue: "All caught up" })
                                            : t("completeLessonFirst", { defaultValue: "Complete a lesson first" })}
                                    </Button>
                                )}
                            </div>

                            {/* Flashcards Card */}
                            <Link
                                to="/flashcards"
                                className={`daily-action-card group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-white p-5 sm:p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-purple-400 hover:shadow-lg cursor-pointer dark:bg-slate-900 ${
                                    activeRoutineIndex === 2
                                        ? "border-purple-500 ring-2 ring-purple-500/40 shadow-[0_12px_36px_rgba(168,85,247,0.18)] -translate-y-0.5"
                                        : "border-purple-300 dark:border-purple-700"
                                }`}
                            >
                                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 opacity-90" />

                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white shadow-md shadow-purple-500/20 transition-transform duration-300 group-hover:scale-105">
                                        <Brain className="h-6 w-6" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-lg font-black tracking-tight text-slate-900 group-hover:text-purple-600 transition-colors dark:text-white dark:group-hover:text-purple-400">
                                                {userProfileTexts.flashcards()}
                                            </h3>
                                            {savedFlashcardsCount != null && savedFlashcardsCount > 0 && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100/80 px-2.5 py-0.5 text-xs font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                                    <Sparkles className="h-3 w-3" />
                                                    {userProfileTexts.savedWordsCount(savedFlashcardsCount)}
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            {savedFlashcardsCount != null && savedFlashcardsCount > 0
                                                ? userProfileTexts.flashcardsSubtitle()
                                                : userProfileTexts.flashcardsSectionDesc()}
                                        </p>
                                        <p className="mt-1.5 text-xs sm:text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                                            {savedFlashcardsCount != null && savedFlashcardsCount > 0
                                                ? userProfileTexts.readyToReview()
                                                : allAssignedLessonsCompleted
                                                    ? t("useCompletedLessonsReview", {
                                                        defaultValue:
                                                            "Use completed lessons as review material while you wait for the next roadmap action.",
                                                    })
                                                    : nextTopic
                                                        ? t("deckUnlocksAfterLesson", {
                                                            topic: nextTopic.name,
                                                            defaultValue: `Your first deck unlocks after you finish a lesson in ${nextTopic.name}.`,
                                                        })
                                                        : t("lockedFeatureDesc", { defaultValue: LOCKED_COPY })}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    className="mt-5 h-11 w-full rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white text-sm sm:text-base font-bold shadow-md shadow-purple-500/25 transition-all duration-200 group-hover:scale-[1.01] pointer-events-none"
                                >
                                    <span>
                                        {savedFlashcardsCount != null && savedFlashcardsCount > 0
                                            ? `${userProfileTexts.reviewFlashcards()} (${savedFlashcardsCount})`
                                            : userProfileTexts.openFlashcards()}
                                    </span>
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </div>
        </div>
    );
}
