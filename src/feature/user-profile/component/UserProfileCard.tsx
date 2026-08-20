import { Avatar, AvatarFallback, AvatarImage } from "@/shadcn/component/ui/avatar";
import { Badge } from "@/shadcn/component/ui/badge";
import { Card, CardContent } from "@/shadcn/component/ui/card";
import {
    BookOpen,
    CalendarDays,
    Camera,
    Clock3,
    Flame,
    GraduationCap,
    Target,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import tmaLogo from "@/asset/image/tma_logo.png";
import { useAuth } from "@/common/context/AuthContext";
import { fetchCurrentUserProfile } from "@/feature/auth/api/authAPI";
import type { UserProfileResponse } from "@/feature/auth/type/Auth";
import {
    fetchJobRoles,
    fetchPlacementTestResult,
} from "@/feature/onboarding/api/onboardingApi";
import {
    calculateLongestStreak,
    getTrackedStudyMinutesTotal,
    getLoginDays,
} from "@/feature/user-profile/utils/StudyActivity";

const STATUS_BAR_ITEMS = [
    {
        key: "streak",
        label: "Day Streak",
        icon: Flame,
        iconClassName: "text-orange-500",
    },
    {
        key: "lessons",
        label: "Lessons",
        icon: BookOpen,
        iconClassName: "text-blue-600",
    },
    {
        key: "accuracy",
        label: "Accuracy",
        icon: GraduationCap,
        iconClassName: "text-green-600",
    },
    {
        key: "study",
        label: "Study Time",
        icon: Clock3,
        iconClassName: "text-slate-500",
    },
] as const;

const profileDateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
});
const profileMonthFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
});

function formatProfileDate(value: string | null | undefined) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return profileDateFormatter.format(parsed);
}

function formatProfileMonth(value: string | null | undefined) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return profileMonthFormatter.format(parsed);
}

function applyProfileTimeline(
    profile: UserProfileResponse,
    setStartedAtLabel: (value: string) => void,
    setEstimatedFinishLabel: (value: string) => void,
    setFinishBadgeLabel: (value: string) => void,
) {
    const startedAt =
        formatProfileDate(profile.started_at) ?? formatProfileDate(profile.created_at);
    const estimatedFinish = formatProfileDate(profile.estimated_finish);
    const finishMonth = formatProfileMonth(profile.estimated_finish);

    setStartedAtLabel(startedAt ?? "Not started yet");
    setEstimatedFinishLabel(estimatedFinish ?? "Estimate pending");
    setFinishBadgeLabel(
        finishMonth ? `On track for ${finishMonth}` : "Estimate pending",
    );
}

function formatStudyDuration(minutes: number) {
    if (minutes <= 0) {
        return "0 min";
    }

    if (minutes < 60) {
        return minutes === 1 ? "1 min" : `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return hours === 1 ? "1h" : `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
}

export function UserProfileCard() {
    const { user } = useAuth();
    const [careerName, setCareerName] = useState<string>("Career Track");
    const [startedAtLabel, setStartedAtLabel] = useState<string>("Not started yet");
    const [estimatedFinishLabel, setEstimatedFinishLabel] = useState<string>("Estimate pending");
    const [finishBadgeLabel, setFinishBadgeLabel] = useState<string>("Estimate pending");
    const [backendStudiedMinutes, setBackendStudiedMinutes] = useState(0);
    const [trackedStudyMinutes, setTrackedStudyMinutes] = useState(0);
<<<<<<< HEAD
    const [lessonsCompleted, setLessonsCompleted] = useState(0);
    const [accuracy, setAccuracy] = useState(0);
=======
>>>>>>> d66bf68efabeaf9d573832a2c443165c67b37066
    const [avatarUrl, setAvatarUrl] = useState(() => {
        const savedAvatar = localStorage.getItem("user_avatar");
        return savedAvatar || "/avatar.png";
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const displayName = user?.username ?? user?.email ?? "Anonymous";
    const initials = displayName
        .split(" ")
        .map((part) => part[0]?.toUpperCase() ?? "")
        .slice(0, 2)
        .join("");

    useEffect(() => {
        let isMounted = true;

        const loadCareerName = async () => {
            const [placementResult, profileResult] = await Promise.allSettled([
                fetchPlacementTestResult(),
                fetchCurrentUserProfile(),
            ]);

            if (profileResult.status === "fulfilled" && isMounted) {
                applyProfileTimeline(
                    profileResult.value,
                    setStartedAtLabel,
                    setEstimatedFinishLabel,
                    setFinishBadgeLabel,
                );
                setBackendStudiedMinutes(
                    Math.max(0, profileResult.value.total_studied_minutes),
                );
<<<<<<< HEAD
                const passedLessons = profileResult.value.lesson_quiz_history?.filter(
                    (entry) => entry.passed,
                ) ?? [];
                const latestScoredLesson = profileResult.value.lesson_quiz_history?.find(
                    (entry) => entry.best_score_percent != null,
                );
                setLessonsCompleted(passedLessons.length);
                setAccuracy(
                    latestScoredLesson?.best_score_percent != null
                        ? Math.round(latestScoredLesson.best_score_percent)
                        : 0,
                );
=======
>>>>>>> d66bf68efabeaf9d573832a2c443165c67b37066
            }

            if (
                placementResult.status === "fulfilled" &&
                placementResult.value.role_name?.trim()
            ) {
                setCareerName(placementResult.value.role_name.trim());
                return;
            }

            const pendingRoleId = Number(localStorage.getItem("pending_role_id"));
            if (!pendingRoleId || Number.isNaN(pendingRoleId)) {
                if (isMounted) {
                    setCareerName("Career Track");
                }
                return;
            }

            try {
                const roles = await fetchJobRoles();
                const matchedRole = roles.find((role) => role.id === pendingRoleId);
                if (isMounted) {
                    setCareerName(matchedRole?.name?.trim() || "Career Track");
                }
            } catch {
                if (isMounted) {
                    setCareerName("Career Track");
                }
            }
        };

        void loadCareerName();

        const handleProfileUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<UserProfileResponse>;
            applyProfileTimeline(
                customEvent.detail,
                setStartedAtLabel,
                setEstimatedFinishLabel,
                setFinishBadgeLabel,
            );
            setBackendStudiedMinutes(
                Math.max(0, customEvent.detail.total_studied_minutes),
            );
<<<<<<< HEAD
            const passedLessons = customEvent.detail.lesson_quiz_history?.filter(
                (entry) => entry.passed,
            ) ?? [];
            const latestScoredLesson = customEvent.detail.lesson_quiz_history?.find(
                (entry) => entry.best_score_percent != null,
            );
            setLessonsCompleted(passedLessons.length);
            setAccuracy(
                latestScoredLesson?.best_score_percent != null
                    ? Math.round(latestScoredLesson.best_score_percent)
                    : 0,
            );
=======
>>>>>>> d66bf68efabeaf9d573832a2c443165c67b37066
        };
        const handleStudyActivityUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<{ userId?: number }>;
            if (customEvent.detail.userId !== user?.id) {
                return;
            }

            setTrackedStudyMinutes(getTrackedStudyMinutesTotal(user.id));
        };
        window.addEventListener("careerpath:profile-updated", handleProfileUpdated);
        window.addEventListener(
            "careerpath:study-activity-updated",
            handleStudyActivityUpdated,
        );

        if (user?.id) {
            setTrackedStudyMinutes(getTrackedStudyMinutesTotal(user.id));
        }

        return () => {
            isMounted = false;
            window.removeEventListener(
                "careerpath:profile-updated",
                handleProfileUpdated,
            );
            window.removeEventListener(
                "careerpath:study-activity-updated",
                handleStudyActivityUpdated,
            );
        };
    }, [user?.id]);

    const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                setAvatarUrl(reader.result);
                localStorage.setItem("user_avatar", reader.result);
            }
        };
        reader.readAsDataURL(file);
        event.target.value = "";
    };

    const longestStreak = useMemo(() => {
        if (!user?.id) return 0;
        return calculateLongestStreak(getLoginDays(user.id));
    }, [user?.id]);
    const totalStudiedMinutes = Math.max(0, backendStudiedMinutes + trackedStudyMinutes);
<<<<<<< HEAD
=======

    const lessonsCompleted = 0;
    const accuracy = 0;
>>>>>>> d66bf68efabeaf9d573832a2c443165c67b37066
    const studyDurationLabel = formatStudyDuration(totalStudiedMinutes);

    const values = {
        streak: {
            value: String(longestStreak),
            helper: longestStreak > 0 ? "Keep it going" : "First day starts here",
        },
        lessons: {
            value: String(lessonsCompleted),
            helper: lessonsCompleted > 0 ? "Completed lessons" : "First lesson unlocks momentum",
        },
        accuracy: {
            value: accuracy > 0 ? `${accuracy}%` : "No quiz yet",
            helper: accuracy > 0 ? "Latest quiz accuracy" : "Appears after your first quiz",
        },
        study: {
            value: studyDurationLabel,
            helper: totalStudiedMinutes > 0 ? "Total time learned" : "Time appears after activity",
        },
    };

    return (
        <Card className="overflow-hidden border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="relative h-24 overflow-hidden bg-[linear-gradient(135deg,#1550c9_0%,#0f8ed8_48%,#8ae1ff_100%)]">
                <div className="pointer-events-none absolute inset-x-0 top-[-3.5rem] h-28 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.32)_44%,rgba(255,255,255,0)_82%)]" />
                <svg
                    aria-hidden="true"
                    viewBox="0 0 1200 220"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-0 h-full w-full opacity-75"
                >
                    <path
                        d="M-24 130C116 50 244 186 382 126C520 66 666 70 804 138C952 212 1060 202 1232 102"
                        fill="none"
                        stroke="rgba(255,255,255,0.28)"
                        strokeWidth="2.5"
                        strokeDasharray="10 14"
                        strokeLinecap="round"
                    />
                    <path
                        d="M58 172C188 126 314 202 448 166C584 130 688 170 818 194C968 222 1082 202 1228 150"
                        fill="none"
                        stroke="rgba(186,230,253,0.42)"
                        strokeWidth="2"
                        strokeDasharray="8 16"
                        strokeLinecap="round"
                    />
                    <circle cx="382" cy="126" r="7" fill="rgba(255,255,255,0.18)" />
                    <circle cx="804" cy="138" r="8" fill="rgba(186,230,253,0.18)" />
                    <circle cx="1006" cy="214" r="8" fill="rgba(255,255,255,0.12)" />
                </svg>
                <img
                    src={tmaLogo}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-1 left-28 h-18 w-auto opacity-[0.18] drop-shadow-[0_8px_18px_rgba(255,255,255,0.22)]"
                />
            </div>

            <CardContent className="px-6 pb-6 pt-0 sm:px-7">
                <div className="-mt-12">
                    <div className="flex min-w-0 gap-4">
                        <div className="relative inline-flex h-fit shrink-0">
                            <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                                <AvatarImage
                                    src={avatarUrl}
                                    alt={displayName}
                                    className="object-cover"
                                />
                                <AvatarFallback>{initials || "?"}</AvatarFallback>
                            </Avatar>

                            <button
                                type="button"
                                aria-label="Change avatar"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md transition hover:bg-blue-700"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />

                        <div className="min-w-0 flex-1 pt-12">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0">
                                    <h2 className="break-words text-3xl font-bold text-slate-900 sm:text-4xl">
                                        {displayName}
                                    </h2>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Badge className="rounded-full bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-900">
                                            {careerName}
                                        </Badge>
                                        <Badge
                                            variant="secondary"
                                            className="rounded-full px-3 py-1.5 text-sm text-slate-700"
                                        >
                                            {finishBadgeLabel}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[330px]">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <CalendarDays className="h-4 w-4 shrink-0" />
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                                                Started
                                            </p>
                                        </div>
                                        <p className="mt-2 text-base font-semibold text-slate-900">
                                            {startedAtLabel}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                                        <div className="flex items-center gap-2 text-blue-700">
                                            <Target className="h-4 w-4 shrink-0" />
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                                                Estimated Finish
                                            </p>
                                        </div>
                                        <p className="mt-2 text-base font-semibold text-slate-900">
                                            {estimatedFinishLabel}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
                            {STATUS_BAR_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const payload = values[item.key];

                                return (
                                    <div
                                        key={item.key}
                                        className="flex items-start gap-3 bg-white px-4 py-4"
                                    >
                                        <div className="rounded-xl bg-slate-50 p-2">
                                            <Icon className={`h-4 w-4 ${item.iconClassName}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                {item.label}
                                            </p>
                                            <p className="mt-1 text-xl font-bold text-slate-900">
                                                {payload.value}
                                            </p>
                                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                                {payload.helper}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
