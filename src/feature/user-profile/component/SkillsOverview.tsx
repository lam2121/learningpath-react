import { Link } from "@tanstack/react-router";
import { BookOpenCheck, Code2, Database, FileText, MessageSquareText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { fetchCurrentUserProfile } from "@/feature/auth/api/authAPI";
import { Button } from "@/shadcn/component/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
import { fetchPlacementTestResult } from "@/feature/onboarding/api/onboardingApi";

const SKILL_META = [
    {
        key: "D_doc",
        label: "Documentation",
        description: "Reading and writing professional documents",
        icon: FileText,
        color: "text-blue-500",
        bar: "bg-blue-400",
        barMuted: "bg-blue-200",
        track: "bg-blue-50",
    },
    {
        key: "C_comm",
        label: "Communication",
        description: "Vocabulary, meetings, emails, and presentations",
        icon: MessageSquareText,
        color: "text-emerald-500",
        bar: "bg-emerald-400",
        barMuted: "bg-emerald-200",
        track: "bg-emerald-50",
    },
    {
        key: "T_trouble",
        label: "Problem Solving",
        description: "Handling risks, conflicts, and changing requirements",
        icon: Database,
        color: "text-rose-500",
        bar: "bg-rose-400",
        barMuted: "bg-rose-200",
        track: "bg-rose-50",
    },
    {
        key: "G_custom",
        label: "Role-Specific Skills",
        description: "Specialized knowledge for the selected career path",
        icon: Code2,
        color: "text-amber-500",
        bar: "bg-amber-400",
        barMuted: "bg-amber-200",
        track: "bg-amber-50",
    },
] as const;

export function SkillsOverview() {
    const [initialSkillScores, setInitialSkillScores] = useState<Record<string, number> | null>(null);
    const [currentSkillScores, setCurrentSkillScores] = useState<Record<string, number> | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadScores = async () => {
            try {
                const [placementResult, profileResult] = await Promise.allSettled([
                    fetchPlacementTestResult(),
                    fetchCurrentUserProfile(),
                ]);

                if (isMounted) {
                    const placementScores =
                        placementResult.status === "fulfilled"
                        && Object.keys(placementResult.value.skill_scores ?? {}).length > 0
                            ? placementResult.value.skill_scores
                            : null;
                    const profileInitialScores =
                        profileResult.status === "fulfilled"
                            ? profileResult.value.initial_skill_scores ?? null
                            : null;
                    const profileCurrentScores =
                        profileResult.status === "fulfilled"
                            ? profileResult.value.current_skill_scores ?? null
                            : null;

                    const nextInitialScores = profileInitialScores ?? placementScores;
                    const nextCurrentScores = profileCurrentScores ?? nextInitialScores;

                    setInitialSkillScores(nextInitialScores);
                    setCurrentSkillScores(nextCurrentScores);
                }
            } catch {
                if (isMounted) {
                    setInitialSkillScores(null);
                    setCurrentSkillScores(null);
                }
            }
        };

        void loadScores();

        return () => {
            isMounted = false;
        };
    }, []);

    const averageScore = useMemo(() => {
        if (!currentSkillScores) return 0;
        const values = Object.values(currentSkillScores);
        if (values.length === 0) return 0;
        return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    }, [currentSkillScores]);

    return (
        <Card className="border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
            <CardHeader className="px-6 pb-3 pt-5">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg text-slate-950">
                            Skills Overview
                        </CardTitle>
                        <p className="mt-1 text-sm text-slate-500">
                            Compare your starting skill scores with your current progress.
                        </p>
                    </div>

                    <div className="rounded-2xl bg-blue-50 px-4 py-3 text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                            Average
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-950">
                            {averageScore}%
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="px-6 pb-6 pt-0">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 px-4 py-6 sm:px-6">
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Initial and Current Score By Skill
                        </p>
                        <div className="hidden items-center gap-4 sm:flex">
                            {SKILL_META.map((skill) => (
                                <div
                                    key={skill.key}
                                    className="flex items-center gap-2 text-xs font-semibold text-slate-500"
                                >
                                    <span className={`h-2.5 w-2.5 rounded-full ${skill.bar}`} />
                                    {skill.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-end justify-around gap-3 sm:gap-5">
                        {SKILL_META.map((skill) => {
                            const Icon = skill.icon;
                            const initialScore = initialSkillScores?.[skill.key] ?? 0;
                            const currentScore = currentSkillScores?.[skill.key] ?? initialScore;

                            return (
                                <div
                                    key={skill.key}
                                    className="flex min-w-0 flex-1 flex-col items-center"
                                >
                                    <div className="mb-3 grid w-full max-w-[7rem] grid-cols-2 gap-2 sm:max-w-[8.5rem]">
                                        <div className="flex flex-col items-center">
                                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Initial
                                            </p>
                                            <div
                                                className={`relative flex h-44 w-full items-end overflow-hidden rounded-t-2xl border border-slate-100 ${skill.track} sm:h-52`}
                                            >
                                                <div
                                                    className={`w-full rounded-t-2xl transition-all duration-700 ease-out ${skill.barMuted}`}
                                                    style={{ height: `${initialScore}%` }}
                                                />
                                            </div>
                                            <p className="mt-2 text-sm font-bold text-slate-500 sm:text-base">
                                                {initialScore}%
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                Current
                                            </p>
                                            <div
                                                className={`relative flex h-44 w-full items-end overflow-hidden rounded-t-2xl border border-slate-100 ${skill.track} sm:h-52`}
                                            >
                                                <div
                                                    className={`w-full rounded-t-2xl transition-all duration-700 ease-out ${skill.bar}`}
                                                    style={{ height: `${currentScore}%` }}
                                                />
                                            </div>
                                            <p className={`mt-2 text-base font-black sm:text-lg ${skill.color}`}>
                                                {currentScore}%
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-col items-center text-center">
                                        <div className="mb-2 rounded-xl bg-white/80 p-2 shadow-sm">
                                            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${skill.color}`} />
                                        </div>
                                        <p className={`text-sm font-bold sm:text-base ${skill.color}`}>
                                            {skill.label}
                                        </p>
                                        <p className="mt-1 hidden text-xs leading-5 text-slate-500 lg:block">
                                            {skill.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {!initialSkillScores ? (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-white p-2 shadow-sm">
                                <BookOpenCheck className="h-5 w-5 text-slate-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-slate-900">
                                    Unlock skill guidance in one step
                                </p>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Take the placement test once to replace all zero-state skill scores with your personalized profile.
                                </p>
                            </div>
                            <Button asChild variant="outline" className="shrink-0 border-slate-300">
                                <Link to="/placement-test">Take placement test</Link>
                            </Button>
                        </div>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
