import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Presentation, Wrench } from "lucide-react";
import { useAuth } from "@/common/context/AuthContext";
import { Button } from "@/shadcn/component/ui/button";
import { LessonFixModal } from "@/feature/admin/component";
import type { RoadmapLesson } from "../api/roadmapApi";
import {
    isLessonGenerated,
    isLessonGenerationFailed,
    isLessonGeneratedButLocked,
    isLessonReadyToStudy,
} from "../lessonAccess";
import {
    getDifficultyBadgeClasses,
    getSkillBadgeClasses,
} from "@/common/utils/historyBadgeStyles";
import { formatLabel, formatMinutes } from "../utils/roadmapFormatters";

interface LessonCardProps {
    lesson: RoadmapLesson;
    isWeakestReview?: boolean;
}

export function LessonCard({
    lesson,
    isWeakestReview = false,
}: LessonCardProps) {
    const { t } = useTranslation("profile");
    const auth = useAuth();
    const isAdmin =
        auth.user?.role === "admin"
        || auth.user?.role_id === 2
        || (auth.user as { roleId?: number } | undefined)?.roleId === 2;
    const [showFixModal, setShowFixModal] = useState(false);
    const isGenerated = isLessonGenerated(lesson);
    const isFailed = isLessonGenerationFailed(lesson);
    const isReadyToStudy = isLessonReadyToStudy(lesson);
    const isGeneratedButLocked = isLessonGeneratedButLocked(lesson);
    const content = (
        <>
            <div
                className={[
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14 transition-all duration-300",
                    lesson.is_completed
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                        : isReadyToStudy
                            ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-400"
                            : "bg-muted text-muted-foreground",
                ].join(" ")}
            >
                <Presentation className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-foreground sm:text-lg transition-colors group-hover:text-primary">
                        {lesson.title}
                    </h3>

                    <span
                        className={[
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            isFailed
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                                : !isGenerated
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                                    : isReadyToStudy
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                        : "bg-muted text-muted-foreground",
                        ].join(" ")}
                    >
                        <span
                            className={[
                                "h-1.5 w-1.5 rounded-full",
                                isFailed
                                    ? "bg-rose-500"
                                    : !isGenerated
                                        ? "bg-amber-500"
                                        : isReadyToStudy
                                            ? "bg-emerald-500"
                                            : "bg-muted-foreground",
                            ].join(" ")}
                        />
                        {isFailed
                            ? t("generationFailed", { defaultValue: "Generation failed" })
                            : !isGenerated
                                ? t("pendingGeneration", { defaultValue: "Pending generation" })
                                : isReadyToStudy
                                    ? t("generated", { defaultValue: "Generated" })
                                    : t("generatedLocked", { defaultValue: "Generated · Locked" })}
                    </span>

                    {lesson.is_completed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            ✓ {t("passedBadge", { defaultValue: "Passed" })}
                        </span>
                    )}

                    {isWeakestReview && (
                        <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            {t("needsReviewBadge", { defaultValue: "🚩 Needs Review" })}
                        </span>
                    )}
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getSkillBadgeClasses(lesson.primary_skill)}`}>
                        {formatLabel(lesson.primary_skill)}
                    </span>

                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getDifficultyBadgeClasses(lesson.difficulty_tier)}`}>
                        {formatLabel(lesson.difficulty_tier)}
                    </span>

                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                        {formatMinutes(lesson.estimated_minutes ?? 0)}
                    </span>
                </div>

                <p className="mt-3 text-sm leading-5 text-muted-foreground">
                    {isFailed
                        ? t("lessonGenerationFailedDesc", { defaultValue: "Generation failed for this lesson. Please contact administrator or retry." })
                        : !isGenerated
                            ? t("lessonNotGeneratedDesc", { defaultValue: "This lesson exists in the roadmap but its content has not been generated yet." })
                            : isGeneratedButLocked
                                ? t("lessonLockedDesc", { defaultValue: "This lesson is generated, but you need to pass the previous lesson in this topic to unlock it." })
                                : t("lessonReadyDesc", { defaultValue: "Theory and quiz content are ready for this lesson." })}
                </p>

                {isFailed && isAdmin && (
                    <div className="mt-3">
                        <Button
                            size="sm"
                            className="h-7 gap-1 bg-amber-600 px-2.5 text-xs font-semibold text-white hover:bg-amber-700"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowFixModal(true);
                            }}
                        >
                            <Wrench className="h-3 w-3" />
                            Fix Lesson (Admin)
                        </Button>
                    </div>
                )}
            </div>

            <div
                className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                    isReadyToStudy
                        ? "border-primary/30 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105 group-hover:shadow-xs dark:border-primary/40 dark:text-blue-400"
                        : "border-border/60 bg-muted/40 text-muted-foreground",
                ].join(" ")}
            >
                <ChevronRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
        </>
    );

    const baseClassName = [
        "group flex h-full w-full min-w-0 items-center gap-3 rounded-2xl border p-4 text-left sm:gap-4 sm:p-5 transition-all duration-200",
        lesson.is_completed
            ? "border-emerald-500/30 bg-card hover:border-emerald-500/50"
            : isReadyToStudy
                ? "border-border/80 bg-card hover:border-primary/40"
                : "border-border/40 bg-card/60 opacity-80",
    ].join(" ");

    return (
        <>
            {!isReadyToStudy ? (
                <div className={baseClassName}>{content}</div>
            ) : (
                <Link
                    to="/lessons/$lessonId"
                    params={{ lessonId: String(lesson.id) }}
                    className={`${baseClassName} card-interactive hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
                >
                    {content}
                </Link>
            )}

            <LessonFixModal
                isOpen={showFixModal}
                onClose={() => setShowFixModal(false)}
                lesson={{
                    id: lesson.id,
                    title: lesson.title,
                    primarySkill: lesson.primary_skill,
                    difficultyTier: lesson.difficulty_tier,
                    hasPartialTheory: Boolean(lesson.theory_content),
                    failedStep: lesson.theory_content ? "C2" : "C1",
                }}
            />
        </>
    );
}
