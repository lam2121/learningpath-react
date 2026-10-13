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
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { userProfileTexts } from "../userProfileTexts";
import { AvatarCropDialog } from "./AvatarCropDialog";

import appLogo from "@/asset/image/careerpath_logo.png";
import { useAuth } from "@/common/context/AuthContext";
import { resolveAvatarUrl } from "@/common/lib/avatar";
import { fetchCurrentUserProfile, uploadUserAvatar } from "@/feature/auth/api/authAPI";
import type { UserProfileResponse } from "@/feature/auth/type/Auth";
import { fetchRoadmap, type RoadmapResponse } from "@/feature/learning-path/api/roadmapApi";
import {
    fetchJobRoles,
    fetchPlacementTestResult,
} from "@/feature/onboarding/api/onboardingApi";
import {
    calculateCurrentStreak,
    calculateLongestStreak,
    getTrackedStudyMinutesTotal,
    getLoginDays,
    LOGIN_DAYS_UPDATED_EVENT,
    STREAK_RESTORED_EVENT,
} from "@/common/utils/StudyActivity";


const STATUS_BAR_ITEMS = [
    {
        key: "streak",
        label: "Day Streak",
        icon: Flame,
        iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
        glow: "shadow-orange-500/25",
        hoverBorder: "hover:border-orange-300/80 hover:shadow-orange-500/10 dark:hover:border-orange-800/80",
        valueColor: "text-orange-700 dark:text-orange-400",
        helperColor: "text-slate-700 dark:text-slate-300",
    },
    {
        key: "lessons",
        label: "Lessons",
        icon: BookOpen,
        iconBg: "bg-gradient-to-br from-blue-600 to-indigo-600",
        glow: "shadow-blue-500/25",
        hoverBorder: "hover:border-blue-300/80 hover:shadow-blue-500/10 dark:hover:border-blue-800/80",
        valueColor: "text-blue-700 dark:text-blue-400",
        helperColor: "text-slate-700 dark:text-slate-300",
    },
    {
        key: "accuracy",
        label: "Accuracy",
        icon: GraduationCap,
        iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
        glow: "shadow-emerald-500/25",
        hoverBorder: "hover:border-emerald-300/80 hover:shadow-emerald-500/10 dark:hover:border-emerald-800/80",
        valueColor: "text-emerald-700 dark:text-emerald-400",
        helperColor: "text-slate-700 dark:text-slate-300",
    },
    {
        key: "study",
        label: "Study Time",
        icon: Clock3,
        iconBg: "bg-gradient-to-br from-cyan-500 to-blue-600",
        glow: "shadow-cyan-500/25",
        hoverBorder: "hover:border-cyan-300/80 hover:shadow-cyan-500/10 dark:hover:border-cyan-800/80",
        valueColor: "text-cyan-700 dark:text-cyan-400",
        helperColor: "text-slate-700 dark:text-slate-300",
    },
] as const;

import { getIntlLocale } from "@/common/utils/historyFormatters";

function formatProfileDate(value: string | null | undefined, locale = "en-US") {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(parsed);
}

function formatProfileMonth(value: string | null | undefined, locale = "en-US") {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
    }).format(parsed);
}

function formatStudyDuration(minutes: number, minLabel = "min") {
    const rounded = Math.round(minutes);
    if (rounded <= 0) {
        return `0 ${minLabel}`;
    }

    return `${rounded} ${minLabel}`;
}

function getRoadmapLessonIds(roadmap: RoadmapResponse | null): Set<number> {
    if (!roadmap) {
        return new Set<number>();
    }

    return new Set(
        roadmap.topics.flatMap((topic) => topic.lessons.map((lesson) => lesson.id)),
    );
}

function computePassedRoadmapAccuracy(
    profile: UserProfileResponse,
    roadmapLessonIds: Set<number>,
) {
    const passedRoadmapLessons = (profile.lesson_quiz_history ?? []).filter(
        (entry) =>
            entry.passed
            && entry.best_score_percent != null
            && roadmapLessonIds.has(entry.lesson_id),
    );

    if (passedRoadmapLessons.length === 0) {
        return 0;
    }

    const totalScore = passedRoadmapLessons.reduce(
        (sum, entry) => sum + (entry.best_score_percent ?? 0),
        0,
    );

    return Math.round(totalScore / passedRoadmapLessons.length);
}

export function UserProfileCard() {
    const { t, i18n } = useTranslation("profile");
    const { user } = useAuth();
    const [careerName, setCareerName] = useState<string>("Career Track");
    const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
    const [backendStudiedMinutes, setBackendStudiedMinutes] = useState(0);
    const [trackedStudyMinutes, setTrackedStudyMinutes] = useState(0);
    const [lessonsCompleted, setLessonsCompleted] = useState(0);
    const [accuracy, setAccuracy] = useState(0);
    const [loginDays, setLoginDays] = useState<string[]>([]);
    const [avatarUrl, setAvatarUrl] = useState<string>("/avatar.png");
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [isCropDialogOpen, setIsCropDialogOpen] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const roadmapLessonIdsRef = useRef<Set<number>>(new Set());

    const displayName = user?.username ?? user?.email ?? "User";
    const initials = displayName
        .split(" ")
        .map((part) => part[0]?.toUpperCase() ?? "")
        .slice(0, 2)
        .join("");

    const hasCustomAvatar = Boolean(
        avatarUrl &&
        avatarUrl !== "/avatar.png" &&
        avatarUrl.trim() !== ""
    );

    const cameraButtonTitle = hasCustomAvatar
        ? t("adjustOrChangeAvatar", { defaultValue: "Adjust or change avatar" })
        : t("uploadAvatar", { defaultValue: "Upload avatar" });

    const handleCameraClick = () => {
        if (hasCustomAvatar) {
            setCropImageSrc(avatarUrl);
            setIsCropDialogOpen(true);
        } else {
            fileInputRef.current?.click();
        }
    };

    useEffect(() => {
        let isMounted = true;

        const loadCareerName = async () => {
            const [placementResult, profileResult, roadmapResult] = await Promise.allSettled([
                fetchPlacementTestResult(),
                fetchCurrentUserProfile(),
                fetchRoadmap(),
            ]);

            roadmapLessonIdsRef.current =
                roadmapResult.status === "fulfilled"
                    ? getRoadmapLessonIds(roadmapResult.value)
                    : new Set<number>();

            if (profileResult.status === "fulfilled" && isMounted) {
                setProfileData(profileResult.value);
                setBackendStudiedMinutes(
                    Math.max(0, profileResult.value.total_studied_minutes),
                );
                const passedLessons = profileResult.value.lesson_quiz_history?.filter(
                    (entry) => entry.passed,
                ) ?? [];
                setLessonsCompleted(passedLessons.length);
                setAccuracy(
                    computePassedRoadmapAccuracy(
                        profileResult.value,
                        roadmapLessonIdsRef.current,
                    ),
                );
                // Load avatar from server profile
                if (profileResult.value.avatar_url) {
                    setAvatarUrl(resolveAvatarUrl(profileResult.value.avatar_url));
                }
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
            if (!isMounted) {
                return;
            }
            setProfileData(customEvent.detail);
            setBackendStudiedMinutes(
                Math.max(0, customEvent.detail.total_studied_minutes),
            );
            const passedLessons = customEvent.detail.lesson_quiz_history?.filter(
                (entry) => entry.passed,
            ) ?? [];
            setLessonsCompleted(passedLessons.length);
            setAccuracy(
                computePassedRoadmapAccuracy(
                    customEvent.detail,
                    roadmapLessonIdsRef.current,
                ),
            );
        };
        const handleStudyActivityUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<{ userId?: number }>;
            if (customEvent.detail.userId !== user?.id) {
                return;
            }

            if (user?.id) {
                setTrackedStudyMinutes(getTrackedStudyMinutesTotal(user.id));
            }
        };
        const handleLoginDaysUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<{ userId?: number }>;
            if (customEvent.detail.userId !== user?.id) {
                return;
            }

            if (user?.id) {
                setLoginDays(getLoginDays(user.id));
            }
        };
        window.addEventListener("careerpath:profile-updated", handleProfileUpdated);
        window.addEventListener(
            "careerpath:study-activity-updated",
            handleStudyActivityUpdated,
        );
        window.addEventListener(LOGIN_DAYS_UPDATED_EVENT, handleLoginDaysUpdated);
        window.addEventListener(STREAK_RESTORED_EVENT, handleLoginDaysUpdated);

        if (user?.id) {
            setTrackedStudyMinutes(getTrackedStudyMinutesTotal(user.id));
            setLoginDays(getLoginDays(user.id));
        } else {
            setLoginDays([]);
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
            window.removeEventListener(
                LOGIN_DAYS_UPDATED_EVENT,
                handleLoginDaysUpdated,
            );
            window.removeEventListener(
                STREAK_RESTORED_EVENT,
                handleLoginDaysUpdated,
            );
        };
    }, [user?.id]);

    const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                setCropImageSrc(reader.result);
                setIsCropDialogOpen(true);
            }
        };
        reader.readAsDataURL(file);
        event.target.value = "";
    };

    const handleCropSave = async (croppedDataUrl: string) => {
        // Optimistically update the UI
        setAvatarUrl(croppedDataUrl);
        setIsCropDialogOpen(false);
        setCropImageSrc(null);

        try {
            // Convert data URL to File for upload
            const response = await fetch(croppedDataUrl);
            const blob = await response.blob();
            const file = new File([blob], "avatar.jpg", { type: blob.type || "image/jpeg" });

            // Upload to server
            const updatedProfile = await uploadUserAvatar(file);

            // Use the server-returned URL as the source of truth
            const resolvedAvatarUrl = resolveAvatarUrl(updatedProfile.avatar_url);
            if (updatedProfile.avatar_url) {
                setAvatarUrl(resolvedAvatarUrl);
            }

            window.dispatchEvent(
                new CustomEvent("careerpath:avatar-updated", {
                    detail: { avatarUrl: resolvedAvatarUrl || croppedDataUrl },
                })
            );
            toast.success(userProfileTexts.avatarSavedSuccess());
        } catch (error) {
            console.error("Failed to upload avatar:", error);
            // Revert on failure
            setAvatarUrl("/avatar.png");
            toast.error("Failed to upload avatar. Please try again.");
        }
    };

    const handleSelectNewImage = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                setCropImageSrc(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const activeStreak = useMemo(() => {
        const current = calculateCurrentStreak(loginDays);
        if (current > 0) return current;
        return calculateLongestStreak(loginDays);
    }, [loginDays]);
    const totalStudiedMinutes = Math.max(0, backendStudiedMinutes + trackedStudyMinutes);
    const minLabel = t("min", { defaultValue: "min" });
    const studyDurationLabel = formatStudyDuration(totalStudiedMinutes, minLabel);

    const currentLocale = getIntlLocale(i18n.language);
    const startedAt = formatProfileDate(profileData?.started_at, currentLocale) ?? formatProfileDate(profileData?.created_at, currentLocale);
    const estimatedFinish = formatProfileDate(profileData?.estimated_finish, currentLocale);
    const finishMonth = formatProfileMonth(profileData?.estimated_finish, currentLocale);

    const startedAtLabel = startedAt ?? userProfileTexts.notStartedYet();
    const estimatedFinishLabel = estimatedFinish ?? userProfileTexts.estimatePending();
    const finishBadgeLabel = finishMonth
        ? userProfileTexts.onTrackFor(finishMonth)
        : userProfileTexts.estimatePending();

    const itemLabelMap: Record<string, string> = {
        streak: userProfileTexts.dayStreak(),
        lessons: userProfileTexts.lessons(),
        accuracy: userProfileTexts.accuracy(),
        study: userProfileTexts.studyTime(),
    };

    const values = {
        streak: {
            value: String(activeStreak),
            helper: activeStreak > 0
                ? t("streakKeepGoing", { defaultValue: "Keep it going" })
                : t("streakFirstDay", { defaultValue: "First day starts here" }),
        },
        lessons: {
            value: String(lessonsCompleted),
            helper: lessonsCompleted > 0
                ? t("completedLessons", { defaultValue: "Completed lessons" })
                : t("firstLessonMomentum", { defaultValue: "First lesson unlocks momentum" }),
        },
        accuracy: {
            value: accuracy > 0 ? `${accuracy}%` : t("noPassedLessonYet", { defaultValue: "No passed lesson yet" }),
            helper: accuracy > 0
                ? t("averageScorePassedRoadmapLessons", { defaultValue: "Average score of passed roadmap lessons" })
                : t("appearsAfterFirstPassedLesson", { defaultValue: "Appears after your first passed lesson" }),
        },
        study: {
            value: studyDurationLabel,
            helper: totalStudiedMinutes > 0
                ? t("totalTimeLearned", { defaultValue: "Total time learned" })
                : t("timeAppearsAfterActivity", { defaultValue: "Time appears after activity" }),
        },
    };

    return (
        <Card className="gap-0 overflow-hidden rounded-3xl border border-border/80 bg-card py-0 shadow-elevation-2">
            {/* Header Cover Banner */}
            <div className="relative h-32 sm:h-36 overflow-hidden bg-gradient-to-r from-primary via-accent-violet to-primary">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(255,255,255,0.25)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,_rgba(255,255,255,0.15)_0%,transparent_50%)]" />
                <svg
                    aria-hidden="true"
                    viewBox="0 0 1200 220"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
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
                        stroke="rgba(186,230,253,0.35)"
                        strokeWidth="2"
                        strokeDasharray="8 16"
                        strokeLinecap="round"
                    />
                    <circle cx="382" cy="126" r="7" fill="rgba(255,255,255,0.2)" />
                    <circle cx="804" cy="138" r="8" fill="rgba(186,230,253,0.2)" />
                    <circle cx="1006" cy="214" r="8" fill="rgba(255,255,255,0.15)" />
                </svg>
                <img
                    src={appLogo}
                    alt="AI Learning Path Logo"
                    aria-hidden="true"
                    className="pointer-events-none absolute right-6 top-3 sm:top-4 h-13 sm:h-15 md:h-16 w-auto opacity-70 drop-shadow-[0_4px_16px_rgba(255,255,255,0.25)]"
                />
            </div>

            <CardContent className="relative z-10 px-4 pb-5 pt-0 sm:px-8 sm:pb-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    {/* Avatar with negative top margin overlapping banner */}
                    <div className="relative -mt-12 sm:-mt-14 inline-flex h-fit shrink-0 group">
                        <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-card shadow-xl ring-2 ring-primary/20 transition-transform group-hover:scale-[1.02]">
                            <AvatarImage
                                src={avatarUrl}
                                alt={displayName}
                                className="object-cover"
                            />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent-violet text-xl font-bold text-white">
                                {initials || "?"}
                            </AvatarFallback>
                        </Avatar>

                        {/* Single Action button: Camera (Upload or Adjust/Change) */}
                        <div className="absolute bottom-0 right-0">
                            <button
                                type="button"
                                aria-label={cameraButtonTitle}
                                onClick={handleCameraClick}
                                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
                                title={cameraButtonTitle}
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleAvatarChange}
                        className="hidden"
                    />

                    {/* User identity & timeline boxes */}
                    <div className="min-w-0 flex-1 pt-0">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0 pt-4 sm:pt-6">
                                <h2 className="font-display break-words text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
                                    {displayName}
                                </h2>

                                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/25">
                                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                        {careerName}
                                    </span>
                                    <Badge
                                        variant="secondary"
                                        className="rounded-full border border-border bg-muted/80 px-3 py-1 text-xs font-bold text-foreground"
                                    >
                                        {finishBadgeLabel}
                                    </Badge>
                                </div>
                            </div>

                            {/* Timeline Cards */}
                            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 mt-3 sm:mt-5 md:min-w-[380px] lg:min-w-[420px]">
                                <div className="group rounded-2xl border border-border bg-muted/40 p-3 sm:p-4 shadow-elevation-1 transition-all hover:border-emerald-500/40 hover:bg-muted/70">
                                    <div className="flex items-center gap-2 sm:gap-2.5 text-emerald-600 dark:text-emerald-400">
                                        <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                                            <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        </span>
                                        <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                                            {userProfileTexts.started()}
                                        </p>
                                    </div>
                                    <p className="font-display mt-1.5 sm:mt-2 text-xs sm:text-base lg:text-lg font-extrabold text-foreground truncate">
                                        {startedAtLabel}
                                    </p>
                                </div>

                                <div className="group rounded-2xl border border-border bg-muted/40 p-3 sm:p-4 shadow-elevation-1 transition-all hover:border-primary/40 hover:bg-muted/70">
                                    <div className="flex items-center gap-2 sm:gap-2.5 text-primary">
                                        <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-primary/15 text-primary shadow-2xs">
                                            <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        </span>
                                        <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                                            {userProfileTexts.targetFinish()}
                                        </p>
                                    </div>
                                    <p className="font-display mt-1.5 sm:mt-2 text-xs sm:text-base lg:text-lg font-extrabold text-foreground truncate">
                                        {estimatedFinishLabel}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4 Metric Tiles */}
                <div className="mt-4 sm:mt-6 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                    {STATUS_BAR_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const payload = values[item.key];

                        return (
                            <div
                                key={item.key}
                                className={`group relative flex items-start gap-2.5 sm:gap-3.5 rounded-2xl border border-border bg-card p-3 sm:p-4.5 shadow-elevation-1 transition-all duration-300 card-interactive-subtle ${item.hoverBorder}`}
                            >
                                <div className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl text-white shadow-md transition-transform duration-300 group-hover:scale-105 ${item.iconBg} ${item.glow}`}>
                                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                                        {itemLabelMap[item.key] || item.label}
                                    </p>
                                    <p className={`font-display mt-0.5 text-xl sm:text-2xl font-black tracking-tight ${item.valueColor}`}>
                                        {payload.value}
                                    </p>
                                    <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs font-medium leading-relaxed line-clamp-1 sm:line-clamp-none text-muted-foreground">
                                        {payload.helper}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>

            <AvatarCropDialog
                open={isCropDialogOpen}
                imageSrc={cropImageSrc}
                onOpenChange={(open) => {
                    setIsCropDialogOpen(open);
                    if (!open) {
                        setCropImageSrc(null);
                    }
                }}
                onSave={handleCropSave}
                onSelectNewImage={handleSelectNewImage}
            />
        </Card>
    );
}
