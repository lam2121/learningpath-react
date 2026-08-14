import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Layers3, Loader2 } from "lucide-react";

import { MainNavigationMenu } from "@/common/component/MainNavigationMenu";
import { Button } from "@/shadcn/component/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
import {
    fetchRoadmap,
    type RoadmapLesson,
    type RoadmapResponse,
    type RoadmapTopic,
} from "@/feature/learning-path/roadmapApi";
import { DailyPlanView } from "../component/DailyPlanView";
import { LearningHistoryChart } from "@/feature/user-profile/component/LearningHistoryChart";
import { UserProfileCard } from "@/feature/user-profile/component/UserProfileCard";

function formatLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatHours(minutes: number | null | undefined) {
    if (minutes == null || minutes <= 0) {
        return "Estimate pending";
    }

    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (remainder === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${remainder}m`;
}

function getNextAssignedLesson(roadmap: RoadmapResponse | null): {
    topic: RoadmapTopic;
    lesson: RoadmapLesson;
} | null {
    if (!roadmap) return null;

    for (const topic of roadmap.topics) {
        const lesson = topic.lessons.find((item) => item.is_generated) ?? topic.lessons[0];
        if (lesson) {
            return { topic, lesson };
        }
    }

    return null;
}

export function UserProfile() {
    const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadRoadmap = async () => {
            try {
                const data = await fetchRoadmap();
                if (isMounted) {
                    setRoadmap(data);
                }
            } catch {
                if (isMounted) {
                    setRoadmap(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadRoadmap();

        return () => {
            isMounted = false;
        };
    }, []);

    const nextAssigned = useMemo(() => getNextAssignedLesson(roadmap), [roadmap]);
    const nextLesson = nextAssigned?.lesson ?? null;
    const nextTopic = nextAssigned?.topic ?? null;

    return (
        <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)]">
            <MainNavigationMenu />

            <div className="w-full px-3 pb-6 pt-3 sm:px-5 lg:px-8">
                <div className="mt-2 space-y-5">
                    <UserProfileCard />

                    <div
                        className="
                            grid items-stretch gap-5
                            xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]
                            2xl:gap-8
                        "
                    >
                        <div className="flex min-w-0 flex-col space-y-5">
                            <Card className="relative overflow-hidden border border-blue-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_42%,#dbeafe_100%)] shadow-[0_30px_80px_rgba(37,99,235,0.16)]">
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.2),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(125,211,252,0.2),_transparent_24%)]" />

                                <CardHeader className="relative pb-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="inline-flex rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-sm">
                                                Your next step
                                            </p>
                                            <CardTitle className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                                                Explore your Learning Path
                                            </CardTitle>
                                            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-600">
                                                Continue where your roadmap is already prepared for you.
                                            </p>
                                        </div>
                                        <div className="rounded-2xl bg-white p-3 shadow-[0_12px_30px_rgba(37,99,235,0.18)] ring-1 ring-blue-100">
                                            <BookOpen className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="relative pt-0">
                                    {isLoading ? (
                                        <div className="flex min-h-[120px] items-center gap-3 rounded-2xl border border-blue-100 bg-white/85 px-5 text-slate-500">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Loading your learning path...
                                        </div>
                                    ) : (
                                        <div className="rounded-3xl border border-white/80 bg-white/[0.88] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-sm">
                                            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                                                <div className="space-y-4">
                                                    <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                                                        {roadmap?.track ? (
                                                            <>
                                                                <span className="rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 ring-1 ring-blue-100">
                                                                    {formatLabel(roadmap.track)}
                                                                </span>
                                                                <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
                                                                    {roadmap.topics.length} topics
                                                                </span>
                                                                {roadmap.total_estimated_minutes > 0 ? (
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
                                                                        <Layers3 className="h-4 w-4" />
                                                                        {formatHours(roadmap.total_estimated_minutes)}
                                                                    </span>
                                                                ) : null}
                                                            </>
                                                        ) : (
                                                            <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
                                                                Explore roadmap topics
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="max-w-4xl text-sm leading-7 text-slate-600">
                                                        {roadmap?.topics.length
                                                            ? "Open your roadmap to review assigned topics, see lesson order, and choose where to continue."
                                                            : "Open your learning path to review your assigned roadmap as soon as it is available."}
                                                    </p>
                                                </div>

                                                <Button asChild className="h-14 min-w-[240px] rounded-2xl bg-blue-600 text-base font-semibold shadow-[0_18px_40px_rgba(37,99,235,0.35)] transition hover:bg-blue-700 hover:shadow-[0_22px_48px_rgba(29,78,216,0.42)]">
                                                    <Link to="/lessons/learning-path">
                                                        Open Learning Path
                                                        <ArrowRight className="ml-2 h-5 w-5" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="flex-1">
                                <LearningHistoryChart />
                            </div>
                        </div>

                        <aside className="h-full min-w-0">
                            <DailyPlanView nextTopic={nextTopic} nextLesson={nextLesson} />
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
}
