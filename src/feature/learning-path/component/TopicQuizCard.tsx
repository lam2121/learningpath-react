import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Award, Lock } from "lucide-react";
import { Button } from "@/shadcn/component/ui/button";
import type { RoadmapTopic } from "../api/roadmapApi";

interface TopicQuizCardProps {
    topic: RoadmapTopic;
}

export function TopicQuizCard({ topic }: TopicQuizCardProps) {
    const { t } = useTranslation("profile");
    const quizStatus = topic.topic_quiz_status ?? "locked";

    if (quizStatus === "locked") {
        return (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                        <Lock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-600 dark:text-slate-300">
                            {t("topicQuizLocked", { defaultValue: "Topic Quiz — Locked" })}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {t("topicQuizLockedDesc", { defaultValue: "Complete and pass all lessons in this topic to unlock the Topic Quiz." })}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const isPassed = quizStatus === "passed";
    const isFailed = quizStatus === "failed";
    const score = topic.topic_quiz_score;
    const weakestIds = topic.weakest_lesson_ids ?? [];

    return (
        <div
            className={[
                "mt-5 rounded-2xl border p-5 transition-all",
                isPassed
                    ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                    : isFailed
                      ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20"
                      : "border-blue-200 bg-blue-50/60 dark:border-blue-900/60 dark:bg-blue-950/20",
            ].join(" ")}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div
                        className={[
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                            isPassed
                                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400"
                                : isFailed
                                  ? "bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400"
                                  : "bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400",
                        ].join(" ")}
                    >
                        <Award className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white">
                            {t("topicQuiz", { defaultValue: "Topic Quiz" })}
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                            {isPassed
                                ? t("passedWithPercent", { score: score ?? 0, defaultValue: `Passed with ${score ?? 0}%` })
                                : isFailed
                                  ? t("lastAttemptRetry", { score: score ?? 0, defaultValue: `Last attempt: ${score ?? 0}% — Retry available` })
                                  : t("topicQuizRequirement", { defaultValue: "30 questions · 75% to pass · No hints" })}
                        </p>

                        {isFailed && weakestIds.length > 0 && (
                            <p className="mt-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                                {t("flaggedForReview", { count: weakestIds.length, defaultValue: `🚩 ${weakestIds.length} lesson${weakestIds.length > 1 ? "s" : ""} flagged for review` })}
                            </p>
                        )}
                    </div>
                </div>

                {isPassed ? (
                    <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                            {t("passedBadge", { defaultValue: "✓ Passed" })}
                        </span>
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-xl px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <Link
                                to="/quiz/$quizType/$targetId"
                                params={{
                                    quizType: "topic",
                                    targetId: String(topic.id),
                                }}
                            >
                                {t("retakeQuiz", { defaultValue: "Retake Quiz" })}
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <Button
                        asChild
                        size="sm"
                        className={[
                            "h-9 rounded-xl px-5 font-bold text-white shadow-sm",
                            isFailed
                                ? "bg-amber-600 hover:bg-amber-700"
                                : "bg-blue-600 hover:bg-blue-700",
                        ].join(" ")}
                    >
                        <Link
                            to="/quiz/$quizType/$targetId"
                            params={{
                                quizType: "topic",
                                targetId: String(topic.id),
                            }}
                        >
                            {isFailed ? t("retryTopicQuiz", { defaultValue: "Retry Topic Quiz" }) : t("takeTopicQuiz", { defaultValue: "Take Topic Quiz" })}
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}
