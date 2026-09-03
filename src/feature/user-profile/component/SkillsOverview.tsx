import { Link } from "@tanstack/react-router";
import { BookOpenCheck, Code2, Database, FileText, MessageSquareText } from "lucide-react";
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
    type JobRoleSkillDefinitions,
} from "@/feature/onboarding/api/onboardingApi";

const DEFAULT_SKILL_DEFINITIONS = {
    D_doc: {
        description: "Ability to read and write clear, concise, and structured technical documentation.",
        example_questions: [],
    },
    C_comm: {
        description: "Effective verbal and written communication in professional IT contexts.",
        example_questions: [],
    },
    T_trouble: {
        description: "Skills in identifying, analyzing, and resolving technical issues.",
        example_questions: [],
    },
    G_custom: {
        description: "Specific domain knowledge and expertise required for this role.",
        example_questions: [],
    },
} as const;

function getSkillDefinitions(role?: JobRole | null) {
    const defs: Partial<JobRoleSkillDefinitions> = role?.skill_definitions ?? {};
    return {
        D_doc: {
            description: defs.D_doc?.description || DEFAULT_SKILL_DEFINITIONS.D_doc.description,
            example_questions: defs.D_doc?.example_questions ?? [],
        },
        C_comm: {
            description: defs.C_comm?.description || DEFAULT_SKILL_DEFINITIONS.C_comm.description,
            example_questions: defs.C_comm?.example_questions ?? [],
        },
        T_trouble: {
            description: defs.T_trouble?.description || DEFAULT_SKILL_DEFINITIONS.T_trouble.description,
            example_questions: defs.T_trouble?.example_questions ?? [],
        },
        G_custom: {
            description: defs.G_custom?.description || DEFAULT_SKILL_DEFINITIONS.G_custom.description,
            example_questions: defs.G_custom?.example_questions ?? [],
        },
    };
}

function SkillDescriptionHover({
    label,
    colorClassName,
    description,
    children,
}: {
    label: string;
    colorClassName: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <HoverCard openDelay={120} closeDelay={80}>
            <HoverCardTrigger asChild>
                {children}
            </HoverCardTrigger>
            <HoverCardContent className="w-72 border-slate-200 bg-white p-3 text-left">
                <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${colorClassName}`}>
                    {label}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                    {description}
                </p>
            </HoverCardContent>
        </HoverCard>
    );
}

const SKILL_META = [
    {
        key: "D_doc",
        label: "Documentation (D)",
        icon: FileText,
        color: "text-blue-500",
        bar: "bg-blue-400",
        barInitial: "bg-blue-300",
        track: "bg-blue-50",
    },
    {
        key: "C_comm",
        label: "Communication (C)",
        icon: MessageSquareText,
        color: "text-emerald-500",
        bar: "bg-emerald-400",
        barInitial: "bg-emerald-300",
        track: "bg-emerald-50",
    },
    {
        key: "T_trouble",
        label: "Troubleshooting (T)",
        icon: Database,
        color: "text-rose-500",
        bar: "bg-rose-400",
        barInitial: "bg-rose-300",
        track: "bg-rose-50",
    },
    {
        key: "G_custom",
        label: "Business (G)",
        icon: Code2,
        color: "text-amber-500",
        bar: "bg-amber-400",
        barInitial: "bg-amber-300",
        track: "bg-amber-50",
    },
] as const;

function formatScore(value: number) {
    return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

export function SkillsOverview() {
    const { t } = useTranslation("profile");
    const [initialSkillScores, setInitialSkillScores] = useState<Record<string, number> | null>(null);
    const [currentSkillScores, setCurrentSkillScores] = useState<Record<string, number> | null>(null);
    const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadScores = async () => {
            try {
                const [placementResult, profileResult, jobRolesResult] = await Promise.allSettled([
                    fetchPlacementTestResult(),
                    fetchCurrentUserProfile(),
                    fetchJobRoles(),
                ]);

                if (isMounted) {
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
                    const nextSelectedRole =
                        placementResult.status === "fulfilled" && jobRolesResult.status === "fulfilled"
                            ? jobRolesResult.value.find((role) => role.id === placementResult.value.role_id) ?? null
                            : null;

                    setInitialSkillScores(nextInitialScores);
                    setCurrentSkillScores(nextCurrentScores);
                    setSelectedRole(nextSelectedRole);
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
    const skillDefinitions = useMemo(() => getSkillDefinitions(selectedRole), [selectedRole]);

    return (
        <Card className="border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
            <CardHeader className="px-6 pb-3 pt-5">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg text-slate-950">
                            {t("skillsOverview", { defaultValue: "Skills Overview" })}
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
                            {t("skillProficiency", { defaultValue: "Initial and Current Score By Skill" })}
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

                    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-5">
                        {SKILL_META.map((skill) => {
                            const Icon = skill.icon;
                            const initialScore = initialSkillScores?.[skill.key] ?? 0;
                            const currentScore = currentSkillScores?.[skill.key] ?? initialScore;

                            return (
                                <div
                                    key={skill.key}
                                    className="flex min-w-0 flex-col items-center"
                                >
                                    <SkillDescriptionHover
                                        label={skill.label}
                                        colorClassName={skill.color}
                                        description={skillDefinitions[skill.key].description}
                                    >
                                        <div className="mb-3 grid w-full max-w-[9.5rem] cursor-help grid-cols-2 gap-2.5 sm:max-w-[10.5rem] sm:gap-3">
                                            <div className="flex flex-col items-center">
                                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                                                    Initial
                                                </p>
                                                <div
                                                    className={`relative flex h-44 w-full items-end overflow-hidden rounded-t-2xl border border-slate-100 ${skill.track} sm:h-52 lg:h-56`}
                                                >
                                                    <div
                                                        className={`w-full rounded-t-2xl transition-all duration-700 ease-out ${skill.barInitial}`}
                                                        style={{ height: `${initialScore}%` }}
                                                    />
                                                </div>
                                                <p className="mt-2 text-sm font-bold text-slate-500 sm:text-base">
                                                    {formatScore(initialScore)}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                                                    Current
                                                </p>
                                                <div
                                                    className={`relative flex h-44 w-full items-end overflow-hidden rounded-t-2xl border border-slate-100 ${skill.track} sm:h-52 lg:h-56`}
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
                                        <div className="mb-2 rounded-xl bg-white/80 p-2 shadow-sm">
                                            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${skill.color}`} />
                                        </div>
                                        <SkillDescriptionHover
                                            label={skill.label}
                                            colorClassName={skill.color}
                                            description={skillDefinitions[skill.key].description}
                                        >
                                            <button
                                                type="button"
                                                className={`text-sm font-bold sm:text-base ${skill.color} underline decoration-dotted underline-offset-4 transition-opacity hover:opacity-80`}
                                            >
                                                {skill.label}
                                            </button>
                                        </SkillDescriptionHover>
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
                                <Link to="/onboarding/placement-test">Take placement test</Link>
                            </Button>
                        </div>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
