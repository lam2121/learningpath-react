import { Link } from "@tanstack/react-router";
import { BookOpenCheck, Code2, Database, FileText, MessageSquareText, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { fetchCurrentUserProfile } from "@/feature/auth/api/authAPI";
import type { UserProfileResponse } from "@/feature/auth/type/Auth";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/shadcn/component/ui/hover-card";
import { Button } from "@/shadcn/component/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
import { useTranslation } from "react-i18next";
import {
    fetchJobRoles,
    fetchPlacementTestResult,
    type JobRole,
} from "@/feature/onboarding/api/onboardingApi";
import { fetchRoadmap } from "@/feature/learning-path/api/roadmapApi";
import { getRoleSkillDetail, type RoleSkillDetail } from "../utils/roleSkillDetails";

function SkillDescriptionHover({
    detail,
    colorClassName,
    children,
}: {
    detail: RoleSkillDetail;
    colorClassName: string;
    children: ReactNode;
}) {
    const { t } = useTranslation("profile");

    return (
        <HoverCard openDelay={100} closeDelay={80}>
            <HoverCardTrigger asChild>
                {children}
            </HoverCardTrigger>
            <HoverCardContent className="w-80 border-slate-200 bg-white p-4 text-left shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                    <p className={`text-[12px] font-bold uppercase tracking-[0.14em] ${colorClassName}`}>
                        {detail.skillLabel}
                    </p>
                    {detail.roleName && (
                        <span className="max-w-[170px] truncate rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {detail.roleName}
                        </span>
                    )}
                </div>

                {detail.description ? (
                    <p className="mt-2.5 text-xs leading-5 text-slate-600 dark:text-slate-300">
                        {detail.description}
                    </p>
                ) : null}

                {detail.exampleQuestions && detail.exampleQuestions.length > 0 ? (
                    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {t("exampleScenarios", { defaultValue: "Example Scenarios:" })}
                        </p>
                        <ul className="mt-1 space-y-1 text-[11px] leading-4 text-slate-600 dark:text-slate-300">
                            {detail.exampleQuestions.map((q, idx) => (
                                <li key={idx} className="italic">
                                    • &ldquo;{q}&rdquo;
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}

                {detail.baselineWeight != null ? (
                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
                        <span>{t("baseline", { defaultValue: "Baseline:" })}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {detail.baselineWeight}%
                        </span>
                    </div>
                ) : null}
            </HoverCardContent>
        </HoverCard>
    );
}

const SKILL_META = [
    {
        key: "D_doc",
        label: "Documentation (D)",
        icon: FileText,
        color: "text-blue-500 dark:text-blue-400",
        bar: "bg-gradient-to-t from-blue-600 to-indigo-500 shadow-sm",
        barInitial: "bg-blue-300/80 dark:bg-blue-500/40",
        track: "bg-blue-50/80 dark:bg-blue-950/30",
    },
    {
        key: "C_comm",
        label: "Communication (C)",
        icon: MessageSquareText,
        color: "text-emerald-500 dark:text-emerald-400",
        bar: "bg-gradient-to-t from-emerald-600 to-teal-500 shadow-sm",
        barInitial: "bg-emerald-300/80 dark:bg-emerald-500/40",
        track: "bg-emerald-50/80 dark:bg-emerald-950/30",
    },
    {
        key: "T_trouble",
        label: "Problem Solving (T)",
        icon: Database,
        color: "text-rose-500 dark:text-rose-400",
        bar: "bg-gradient-to-t from-rose-600 to-pink-500 shadow-sm",
        barInitial: "bg-rose-300/80 dark:bg-rose-500/40",
        track: "bg-rose-50/80 dark:bg-rose-950/30",
    },
    {
        key: "G_custom",
        label: "Specialization (G)",
        icon: Code2,
        color: "text-amber-500 dark:text-amber-400",
        bar: "bg-gradient-to-t from-amber-500 to-orange-500 shadow-sm",
        barInitial: "bg-amber-300/80 dark:bg-amber-500/40",
        track: "bg-amber-50/80 dark:bg-amber-950/30",
    },
] as const;

function formatScore(value: number) {
    return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

export function SkillsOverview() {
    const { t, i18n } = useTranslation("profile");
    const [initialSkillScores, setInitialSkillScores] = useState<Record<string, number> | null>(null);
    const [currentSkillScores, setCurrentSkillScores] = useState<Record<string, number> | null>(null);
    const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadScores = async () => {
            try {
                const [placementResult, profileResult, jobRolesResult, roadmapResult] = await Promise.allSettled([
                    fetchPlacementTestResult(),
                    fetchCurrentUserProfile(),
                    fetchJobRoles(),
                    fetchRoadmap(),
                ]);

                if (isMounted) {
                    const allRoles = jobRolesResult.status === "fulfilled" ? jobRolesResult.value : [];

                    const placementInitialRadarScores =
                        placementResult.status === "fulfilled"
                            ? placementResult.value.radar_score?.start_vector ?? null
                            : null;
                    const placementCurrentRadarScores =
                        placementResult.status === "fulfilled"
                            ? placementResult.value.radar_score?.current_vector ?? null
                            : null;
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

                    const nextInitialScores =
                        placementInitialRadarScores
                        ?? profileInitialScores
                        ?? placementScores;
                    const nextCurrentScores =
                        placementCurrentRadarScores
                        ?? profileCurrentScores
                        ?? nextInitialScores;

                    // Match role adaptively
                    let matchedRole: JobRole | null = null;

                    // 1. Placement test role_id
                    if (placementResult.status === "fulfilled" && placementResult.value.role_id) {
                        matchedRole = allRoles.find((role) => role.id === placementResult.value.role_id) ?? null;
                    }

                    // 2. Placement test role_name
                    if (!matchedRole && placementResult.status === "fulfilled" && placementResult.value.role_name) {
                        const pName = placementResult.value.role_name.toLowerCase().trim();
                        matchedRole = allRoles.find((r) => r.name.toLowerCase().trim() === pName || r.name.toLowerCase().includes(pName)) ?? null;
                    }

                    // 3. Roadmap track
                    if (!matchedRole && roadmapResult.status === "fulfilled" && roadmapResult.value.track) {
                        const trackName = roadmapResult.value.track.toLowerCase().trim();
                        matchedRole = allRoles.find((r) => r.name.toLowerCase().trim() === trackName || trackName.includes(r.name.toLowerCase().trim())) ?? null;
                    }

                    // 4. Final quiz history in user profile
                    if (!matchedRole && profileResult.status === "fulfilled") {
                        const historyRoleId = profileResult.value.final_quiz_history?.[0]?.job_role_id;
                        const historyRoleName = profileResult.value.final_quiz_history?.[0]?.role_name;
                        if (historyRoleId) {
                            matchedRole = allRoles.find((r) => r.id === historyRoleId) ?? null;
                        }
                        if (!matchedRole && historyRoleName) {
                            const hName = historyRoleName.toLowerCase().trim();
                            matchedRole = allRoles.find((r) => r.name.toLowerCase().trim() === hName || hName.includes(r.name.toLowerCase().trim())) ?? null;
                        }
                    }

                    // 5. Local storage fallback
                    if (!matchedRole) {
                        const pendingId = Number(localStorage.getItem("pending_role_id"));
                        if (pendingId && !Number.isNaN(pendingId)) {
                            matchedRole = allRoles.find((r) => r.id === pendingId) ?? null;
                        }
                        const savedCareer = localStorage.getItem("career_path");
                        if (!matchedRole && savedCareer) {
                            const sName = savedCareer.toLowerCase().trim();
                            matchedRole = allRoles.find((r) => r.name.toLowerCase().trim() === sName || sName.includes(r.name.toLowerCase().trim())) ?? null;
                        }
                    }

                    // 6. Default to first role if available
                    if (!matchedRole && allRoles.length > 0) {
                        matchedRole = allRoles[0];
                    }

                    setInitialSkillScores(nextInitialScores);
                    setCurrentSkillScores(nextCurrentScores);
                    setSelectedRole(matchedRole);
                }
            } catch {
                if (isMounted) {
                    setInitialSkillScores(null);
                    setCurrentSkillScores(null);
                    setSelectedRole(null);
                }
            }
        };

        void loadScores();

        const handleProfileUpdated = (event: Event) => {
            if (!isMounted) {
                return;
            }

            const customEvent = event as CustomEvent<UserProfileResponse>;
            void customEvent;
            void loadScores();
        };

        window.addEventListener("careerpath:profile-updated", handleProfileUpdated);

        return () => {
            isMounted = false;
            window.removeEventListener("careerpath:profile-updated", handleProfileUpdated);
        };
    }, []);

    const averageScore = useMemo(() => {
        if (!currentSkillScores) return 0;
        const values = Object.values(currentSkillScores);
        if (values.length === 0) return 0;
        return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    }, [currentSkillScores]);

    const getSkillLabel = (key: string, fallback: string) => {
        if (key === "D_doc") return t("skillDoc", { defaultValue: fallback });
        if (key === "C_comm") return t("skillComm", { defaultValue: fallback });
        if (key === "T_trouble") return t("skillTrouble", { defaultValue: fallback });
        if (key === "G_custom") return t("skillCustom", { defaultValue: fallback });
        return fallback;
    };

    const getSkillDetail = (key: string, fallbackLabel: string) => {
        return getRoleSkillDetail(selectedRole, key, getSkillLabel(key, fallbackLabel), i18n.language);
    };

    return (
        <Card className="rounded-3xl border border-slate-300 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
            <CardHeader className="flex flex-col gap-4 px-6 pt-6 sm:px-8 sm:pt-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
                        <Target className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            {t("skillsOverview")}
                        </CardTitle>
                        <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                            {t("skillsCompareDesc", {
                                defaultValue:
                                    "Compare your starting skill scores with your current progress.",
                            })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 px-4 py-2 text-center dark:border-blue-800 dark:from-blue-950/50 dark:to-indigo-950/40">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                            {t("average")}
                        </p>
                        <p className="text-xl font-black text-blue-900 dark:text-white">
                            {averageScore}%
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="px-6 pb-6 pt-0 sm:px-8 sm:pb-8">
                <div className="rounded-3xl border border-slate-300 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/40 px-5 py-6 sm:px-7 dark:border-slate-700 dark:from-slate-950/70 dark:via-slate-900/50 dark:to-slate-950/60">
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <p className="text-[14px] font-extrabold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-200">
                            {t("skillProficiency", { defaultValue: "Initial and Current Score By Skill" })}
                        </p>
                        <div className="hidden items-center gap-4 sm:flex">
                            {SKILL_META.map((skill) => {
                                const detail = getSkillDetail(skill.key, skill.label);
                                return (
                                    <SkillDescriptionHover
                                        key={skill.key}
                                        detail={detail}
                                        colorClassName={skill.color}
                                    >
                                        <div className="flex cursor-help items-center gap-2 text-[14px] font-bold text-slate-700 transition-opacity hover:opacity-80 dark:text-slate-200">
                                            <span className={`h-2.5 w-2.5 rounded-full ${skill.bar}`} />
                                            {detail.skillLabel}
                                        </div>
                                    </SkillDescriptionHover>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-5">
                        {SKILL_META.map((skill) => {
                            const Icon = skill.icon;
                            const initialScore = initialSkillScores?.[skill.key] ?? 0;
                            const currentScore = currentSkillScores?.[skill.key] ?? initialScore;
                            const detail = getSkillDetail(skill.key, skill.label);

                            return (
                                <div
                                    key={skill.key}
                                    className="flex min-w-0 flex-col items-center"
                                >
                                    <SkillDescriptionHover
                                        detail={detail}
                                        colorClassName={skill.color}
                                    >
                                        <div className="mb-3 grid w-full max-w-[9.5rem] cursor-help grid-cols-2 gap-2.5 sm:max-w-[10.5rem] sm:gap-4">
                                            <div className="flex flex-col items-center">
                                                <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
                                                    {t("initial")}
                                                </p>
                                                <div
                                                    className={`relative flex h-44 w-full items-end overflow-hidden rounded-t-2xl border border-slate-200 dark:border-slate-700/60 ${skill.track} sm:h-52 lg:h-56`}
                                                >
                                                    <div
                                                        className={`w-full rounded-t-2xl transition-all duration-700 ease-out ${skill.barInitial}`}
                                                        style={{ height: `${initialScore}%` }}
                                                    />
                                                </div>
                                                <p className="mt-2 text-sm font-extrabold text-slate-700 sm:text-base dark:text-slate-200">
                                                    {formatScore(initialScore)}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
                                                    {t("current")}
                                                </p>
                                                <div
                                                    className={`relative flex h-44 w-full items-end overflow-hidden rounded-t-2xl border border-slate-200 dark:border-slate-700/60 ${skill.track} sm:h-52 lg:h-56`}
                                                >
                                                    <div
                                                        className={`w-full rounded-t-2xl transition-all duration-700 ease-out ${skill.bar}`}
                                                        style={{ height: `${currentScore}%` }}
                                                    />
                                                </div>
                                                <p className={`mt-2 text-base font-black sm:text-lg ${skill.color}`}>
                                                    {formatScore(currentScore)}
                                                </p>
                                            </div>
                                        </div>
                                    </SkillDescriptionHover>

                                    <div className="mt-4 flex flex-col items-center text-center">
                                        <div className="mb-2 rounded-xl border border-slate-200/60 bg-white/80 p-2 shadow-sm dark:border-slate-700/60 dark:bg-slate-800">
                                            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${skill.color}`} />
                                        </div>
                                        <SkillDescriptionHover
                                            detail={detail}
                                            colorClassName={skill.color}
                                        >
                                            <button
                                                type="button"
                                                className={`text-sm font-bold sm:text-base ${skill.color} underline decoration-dotted underline-offset-4 transition-opacity hover:opacity-80`}
                                            >
                                                {detail.skillLabel}
                                            </button>
                                        </SkillDescriptionHover>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {!initialSkillScores ? (
                    <div className="mt-5 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/60">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-white p-2 shadow-sm dark:bg-slate-800">
                                <BookOpenCheck className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    {t("unlockSkillTitle")}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    {t("unlockSkillDesc")}
                                </p>
                            </div>
                            <Button asChild variant="outline" className="shrink-0 border-slate-300 dark:border-slate-700">
                                <Link to="/onboarding/placement-test">{t("takePlacementTest")}</Link>
                            </Button>
                        </div>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
