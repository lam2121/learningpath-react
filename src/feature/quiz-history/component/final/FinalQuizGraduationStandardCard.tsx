import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";

interface FinalQuizGraduationStandardCardProps {
    uiTokens: {
        panel: string;
        header: string;
    };
}

export function FinalQuizGraduationStandardCard({ uiTokens }: FinalQuizGraduationStandardCardProps) {
    const { t } = useTranslation("history");

    return (
        <div className="space-y-4 lg:col-span-1">
            <Card className={uiTokens.panel}>
                <CardHeader className={`${uiTokens.header} px-4 py-3 sm:px-5`}>
                    <div className="flex items-center gap-2 text-white">
                        <div className="rounded-lg bg-white/25 p-1 text-white">
                            <ShieldCheck className="h-3.5 w-3.5" />
                        </div>
                        <CardTitle className="text-lg font-bold text-white">
                            {t("finalQuiz.standardTitle", { defaultValue: "Graduation Standard" })}
                        </CardTitle>
                    </div>
                </CardHeader>

                <CardContent className="space-y-5 p-4 sm:p-5">
                    <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3.5 sm:p-4 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200">
                        <p className="mb-2 text-sm sm:text-base font-bold text-sky-900 dark:text-sky-300">
                            {t("finalQuiz.dualGateTitle", { defaultValue: "Dual-Gate Criteria:" })}
                        </p>
                        <ul className="space-y-2 text-sm sm:text-base font-semibold">
                            <li className="flex items-center gap-2">
                                <span className="text-base font-bold text-sky-600 dark:text-sky-400">✓</span>
                                <span>{t("finalQuiz.overallScoreReq", { defaultValue: "Overall Score ≥ 80%" })}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-base font-bold text-sky-600 dark:text-sky-400">✓</span>
                                <span>{t("finalQuiz.allSkillsReq", { defaultValue: "All 4 skills ≥ 60%" })}</span>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <label className="mb-2.5 block text-sm font-bold uppercase tracking-[0.14em] text-[#005596]/80 dark:text-cyan-400/90">
                            {t("finalQuiz.skillsEvaluated", { defaultValue: "Graduation Skills Evaluated:" })}
                        </label>
                        <div className="space-y-2.5 text-sm sm:text-base font-semibold">
                            <p className="flex justify-between font-semibold text-[#005596] dark:text-cyan-300">
                                <span>• {t("finalQuiz.docSkill", { defaultValue: "Documentation (D)" })}</span>
                                <span className="font-bold text-slate-600 dark:text-slate-300">≥ 60%</span>
                            </p>
                            <p className="flex justify-between font-semibold text-teal-700 dark:text-teal-300">
                                <span>• {t("finalQuiz.commSkill", { defaultValue: "Communication (C)" })}</span>
                                <span className="font-bold text-slate-600 dark:text-slate-300">≥ 60%</span>
                            </p>
                            <p className="flex justify-between font-semibold text-rose-700 dark:text-rose-300">
                                <span>• {t("finalQuiz.troubleSkill", { defaultValue: "Problem Solving (T)" })}</span>
                                <span className="font-bold text-slate-600 dark:text-slate-300">≥ 60%</span>
                            </p>
                            <p className="flex justify-between font-semibold text-amber-700 dark:text-amber-300">
                                <span>• {t("finalQuiz.businessSkill", { defaultValue: "Specialization (G)" })}</span>
                                <span className="font-bold text-slate-600 dark:text-slate-300">≥ 60%</span>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
