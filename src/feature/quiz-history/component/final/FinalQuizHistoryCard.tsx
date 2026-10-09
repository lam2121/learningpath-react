import { useEffect, useMemo, useState } from "react";
import {
    Award,
    GraduationCap,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { fetchCurrentUserProfile } from "@/feature/auth/api/authAPI";
import type { UserProfileResponse } from "@/feature/auth/type/Auth";
import {
    fetchFinalQuizState,
    type FinalQuizSubmitResponse,
} from "@/feature/learning-path/api/roadmapApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
import { formatLabel } from "@/common/utils/historyFormatters";
import { FinalQuizGraduationStandardCard } from "./FinalQuizGraduationStandardCard";
import { FinalQuizHistoryItem } from "./FinalQuizHistoryItem";
import { FinalQuizDetailDialog } from "./FinalQuizDetailDialog";

const uiTokens = {
    panel: "gap-0 overflow-hidden rounded-2xl border border-cyan-200 bg-slate-50 py-0 shadow-[0_12px_32px_rgba(0,114,187,0.14)] dark:border-cyan-900/40 dark:bg-slate-900 dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)]",
    header: "border-b border-cyan-200/70 bg-gradient-to-r from-[#005596] via-[#0072BB] to-[#00A9CE] dark:border-cyan-900/50 dark:from-slate-900 dark:via-cyan-950/60 dark:to-slate-900",
} as const;

const SKILL_LABELS: Record<string, string> = {
    D_doc: "Documentation",
    C_comm: "Communication",
    T_trouble: "Problem Solving",
    G_custom: "Specialization",
};

export function FinalQuizHistoryCard() {
    const { t } = useTranslation(["history", "profile"]);
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);

    // Modal state for question review
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [finalDetail, setFinalDetail] = useState<FinalQuizSubmitResponse | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [reviewFilter, setReviewFilter] = useState<"all" | "correct" | "incorrect">("all");

    const getSkillLabel = (skill: string) => {
        switch (skill) {
            case "D_doc":
                return t("finalQuiz.docSkill", { defaultValue: "Documentation (D)" });
            case "C_comm":
                return t("finalQuiz.commSkill", { defaultValue: "Communication (C)" });
            case "T_trouble":
                return t("finalQuiz.troubleSkill", { defaultValue: "Problem Solving (T)" });
            case "G_custom":
                return t("finalQuiz.businessSkill", { defaultValue: "Specialization (G)" });
            default:
                return SKILL_LABELS[skill] ?? formatLabel(skill);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const loadProfile = async () => {
            try {
                const response = await fetchCurrentUserProfile();
                if (isMounted) setProfile(response);
            } catch {
                if (isMounted) setProfile(null);
            }
        };
        void loadProfile();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const handlePopState = () => {
            if (isDetailOpen) {
                setIsDetailOpen(false);
                setFinalDetail(null);
                setDetailError(null);
            }
        };

        if (isDetailOpen) {
            window.history.pushState({ isFinalDetailModalOpen: true }, "");
            window.addEventListener("popstate", handlePopState);
        }

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [isDetailOpen]);

    const finalHistory = useMemo(
        () => profile?.final_quiz_history ?? [],
        [profile],
    );

    const primaryFinalQuiz = finalHistory[0] ?? null;

    const openFinalDetail = async () => {
        setIsDetailOpen(true);
        setFinalDetail(null);
        setDetailError(null);
        setDetailLoading(true);
        setReviewFilter("all");

        try {
            const state = await fetchFinalQuizState();
            const bestAttempt = state.best_attempt ?? state.latest_attempt ?? state.first_pass ?? null;
            if (bestAttempt) {
                setFinalDetail(bestAttempt);
            } else {
                setDetailError(t("finalQuiz.detail.noAttemptFound", { defaultValue: "No detailed final quiz attempt found in your record." }));
            }
        } catch (err) {
            setDetailError(err instanceof Error ? err.message : t("finalQuiz.detail.loadFailed", { defaultValue: "Failed to load final quiz details." }));
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
                {/* LEFT SIDEBAR: Graduation Exam Requirements */}
                <FinalQuizGraduationStandardCard uiTokens={uiTokens} />

                {/* RIGHT CONTENT AREA: Final Course Quiz Record */}
                <div className="min-w-0 space-y-4 lg:col-span-3">
                    <Card className={`flex min-w-0 flex-col ${uiTokens.panel}`}>
                        <CardHeader className={`${uiTokens.header} px-5 py-4 sm:px-6`}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-2xl font-black text-white sm:text-3xl">
                                        {t("finalQuiz.title", { defaultValue: "Best Final Course Quiz Score" })}
                                    </CardTitle>
                                    <p className="mt-1 text-base text-cyan-100">
                                        {t("finalQuiz.subtitle", { defaultValue: "Highest graduation examination score saved for your enrolled career track." })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 self-start sm:self-auto">
                                    <span className="whitespace-nowrap rounded-xl border border-white/30 bg-white/20 px-3 py-1.5 text-sm font-black uppercase tracking-[0.14em] text-white shadow-sm">
                                        {t("finalQuiz.badge", { defaultValue: "Graduation Exam" })}
                                    </span>
                                    <div className="rounded-xl bg-amber-400 p-2 text-white shadow-sm">
                                        <Award className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5 sm:p-6">
                            {!primaryFinalQuiz ? (
                                <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-cyan-100 bg-cyan-50/60 px-4 py-6 text-center dark:border-cyan-900/40 dark:bg-cyan-950/20">
                                    <GraduationCap className="h-10 w-10 text-cyan-500" />
                                    <div className="w-full flex flex-col items-center justify-center text-center">
                                        <p className="w-full text-center text-lg font-bold text-slate-900 dark:text-white" style={{ textAlign: "center" }}>
                                            {t("finalQuiz.empty.noRecordTitle", { defaultValue: "No Final Course Quiz Record Yet" })}
                                        </p>
                                        <p className="mt-2 w-full text-center text-base leading-7 text-slate-500 dark:text-slate-400" style={{ textAlign: "center" }}>
                                            {t("finalQuiz.empty.noRecordDesc", { defaultValue: "Complete all Topic Quizzes in your roadmap to unlock the Final Course Quiz." })}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <FinalQuizHistoryItem
                                        primaryFinalQuiz={primaryFinalQuiz}
                                        onClick={() => void openFinalDetail()}
                                        getSkillLabel={getSkillLabel}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* DETAIL MODAL: Question Review for Final Course Quiz */}
            <FinalQuizDetailDialog
                open={isDetailOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        if (window.history.state?.isFinalDetailModalOpen) {
                            window.history.back();
                        }
                        setIsDetailOpen(false);
                        setFinalDetail(null);
                        setDetailError(null);
                    }
                }}
                primaryFinalQuiz={primaryFinalQuiz}
                finalDetail={finalDetail}
                detailLoading={detailLoading}
                detailError={detailError}
                reviewFilter={reviewFilter}
                onReviewFilterChange={setReviewFilter}
                getSkillLabel={getSkillLabel}
            />
        </>
    );
}
