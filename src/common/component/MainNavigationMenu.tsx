import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useScrollDirection } from "@/common/hook/useScrollDirection";
import { MobilePageTitle } from "./MobilePageTitle";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/shadcn/component/ui/navigation-menu";
import {
    AlertDialog,
} from "@/shadcn/component/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shadcn/component/ui/dropdown-menu";
import { Button } from "../../shadcn/component/ui/button";
import { Dialog } from "@/shadcn/component/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/shadcn/component/ui/avatar";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/shadcn/component/ui/sheet";
import {
    History,
    LayoutDashboard,
    LogOut,
    Menu,
    Settings,
    User,
} from "lucide-react";
import { useAuth } from "@/common/context/AuthContext";
import { resolveAvatarUrl } from "@/common/lib/avatar";
import {
    fetchCurrentUserProfile,
    updateStudySettings,
} from "@/feature/auth/api/authAPI";
import type { UserProfileResponse } from "@/feature/auth/type/Auth";
import {
    ChangeCareerAlert,
    StudySettingsDialog,
    StudyTimeAlert,
    StudyTimeDialog,
    LogoutConfirmDialog,
} from "./shared-dialog";
import { cn } from "@/shadcn/lib/util";
import { TmaLogo } from "./TmaLogo";
import { APP_INFO } from "@/const/appConst";
import { CareerpathIcon } from "../../common/component/SocialMediaIcon";
import { NotificationDropdown, StreakDropdown } from "./navbar";
import { useCareerTrackReset } from "@/feature/user-profile/hook/useCareerTrackReset";
import { MobileBottomBar } from "./MobileBottomBar";

function estimateDays(totalMinutes: number, dailyStudyMinutes: number) {
    if (totalMinutes <= 0 || dailyStudyMinutes <= 0) {
        return null;
    }

    return Math.max(1, Math.ceil(totalMinutes / dailyStudyMinutes));
}

export function MainNavigationMenu({
    onNavigateIntent,
    disableStudySettings = false,
}: {
    onNavigateIntent?: (to: string) => boolean;
    disableStudySettings?: boolean;
}) {
    const { t } = useTranslation(["nav", "profile"]);
    const router = useRouter();
    const navigate = useNavigate();
    const auth = useAuth();
    const [openSetting, setOpenSetting] = useState(false);
    const [openCareerAlert, setOpenCareerAlert] = useState(false);
    const [openStudyTime, setOpenStudyTime] = useState(false);
    const [openStudyTimeAlert, setOpenStudyTimeAlert] = useState(false);
    const [openLogoutConfirm, setOpenLogoutConfirm] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [currentMinutes, setCurrentMinutes] = useState(120);
    const [newMinutes, setNewMinutes] = useState(120);
    const [totalEstimatedMinutes, setTotalEstimatedMinutes] = useState(0);
    const [isSavingStudyTime, setIsSavingStudyTime] = useState(false);
    const [studyTimeError, setStudyTimeError] = useState<string | null>(null);
    const {
        clearResetError,
        isResetting,
        resetCareerTrack,
        resetError,
    } = useCareerTrackReset();

    const displayName = auth.user?.username || auth.user?.email || "User";
    const initials = displayName
        .split(" ")
        .map((part) => part[0]?.toUpperCase() ?? "")
        .slice(0, 2)
        .join("");

    const [avatarUrl, setAvatarUrl] = useState("/avatar.png");

    useEffect(() => {
        const handleAvatarUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<{ avatarUrl?: string }>;
            if (customEvent.detail?.avatarUrl) {
                setAvatarUrl(resolveAvatarUrl(customEvent.detail.avatarUrl));
            }
        };

        window.addEventListener("careerpath:avatar-updated", handleAvatarUpdated);
        window.addEventListener("storage", handleAvatarUpdated);

        return () => {
            window.removeEventListener("careerpath:avatar-updated", handleAvatarUpdated);
            window.removeEventListener("storage", handleAvatarUpdated);
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        if (!auth.isAuthenticated) {
            return;
        }

        const loadProfile = async () => {
            try {
                const profile = await fetchCurrentUserProfile({ redirectOnAuthFailure: false });
                if (!isMounted) {
                    return;
                }

                const minutes = profile.daily_study_minutes || 120;
                setCurrentMinutes(minutes);
                setNewMinutes(minutes);
                setTotalEstimatedMinutes(profile.total_estimated_minutes);
                // Load avatar from server profile
                if (profile.avatar_url) {
                    setAvatarUrl(resolveAvatarUrl(profile.avatar_url));
                }
            } catch {
                if (!isMounted) {
                    return;
                }

                setCurrentMinutes(120);
                setNewMinutes(120);
                setTotalEstimatedMinutes(0);
            }
        };

        void loadProfile();

        const handleProfileUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<UserProfileResponse>;
            if (!isMounted) {
                return;
            }

            const minutes = customEvent.detail.daily_study_minutes || 120;
            setCurrentMinutes(minutes);
            setNewMinutes(minutes);
            setTotalEstimatedMinutes(customEvent.detail.total_estimated_minutes);
        };

        window.addEventListener("careerpath:profile-updated", handleProfileUpdated);

        return () => {
            isMounted = false;
            window.removeEventListener("careerpath:profile-updated", handleProfileUpdated);
        };
    }, [auth.isAuthenticated]);

    const handleLogout = () => {
        setOpenLogoutConfirm(true);
    };

    const performLogout = async () => {
        setIsLoggingOut(true);
        try {
            await auth.logout();
            await router.invalidate();
            await navigate({ to: "/" });
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setIsLoggingOut(false);
            setOpenLogoutConfirm(false);
        }
    };

    const currentDays = estimateDays(totalEstimatedMinutes, currentMinutes);
    const projectedDays = estimateDays(totalEstimatedMinutes, newMinutes);

    const handleStudySettingsUpdated = (profile: UserProfileResponse) => {
        const minutes = profile.daily_study_minutes || 120;
        setCurrentMinutes(minutes);
        setNewMinutes(minutes);
        setTotalEstimatedMinutes(profile.total_estimated_minutes);
        window.dispatchEvent(
            new CustomEvent<UserProfileResponse>("careerpath:profile-updated", {
                detail: profile,
            }),
        );
    };

    const handleNavigationClick = (
        event: ReactMouseEvent<HTMLElement>,
        to: string,
    ) => {
        if (!onNavigateIntent) {
            return;
        }

        const handled = onNavigateIntent(to);
        if (handled) {
            event.preventDefault();
        }
    };

    const NavigationItems = () => {
        const { t } = useTranslation(["nav", "profile"]);
        return (
            <>
                <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                        <Link
                            to="/"
                            onClick={(event) => handleNavigationClick(event, "/")}
                            activeProps={{
                                className: "bg-primary/10 text-primary font-semibold dark:bg-primary/20 dark:text-blue-400 shadow-2xs",
                            }}
                            activeOptions={{ exact: true }}
                            className="rounded-lg px-3.5 py-1.5 !text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground"
                        >
                            {t("home", { ns: "nav", defaultValue: "Home" })}
                        </Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                        <Link
                            to="/lessons/learning-path"
                            onClick={(event) => handleNavigationClick(event, "/lessons/learning-path")}
                            activeProps={{
                                className: "bg-primary/10 text-primary font-semibold dark:bg-primary/20 dark:text-blue-400 shadow-2xs",
                            }}
                            className="rounded-lg px-3.5 py-1.5 !text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground"
                        >
                            {t("path", { ns: "nav", defaultValue: "Path" })}
                        </Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                        <Link
                            to="/guide"
                            onClick={(event) => handleNavigationClick(event, "/guide")}
                            activeProps={{
                                className: "bg-primary/10 text-primary font-semibold dark:bg-primary/20 dark:text-blue-400 shadow-2xs",
                            }}
                            className="rounded-lg px-3.5 py-1.5 !text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground"
                        >
                            {t("howItWorks", { ns: "nav", defaultValue: "How It Works" })}
                        </Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
            </>
        );
    };

    const scrollDirection = useScrollDirection();
    const isMobileHeaderHidden = scrollDirection === 'down' && auth.isAuthenticated;

    return (
        <div>
            {/* Desktop spacer — always h-13 */}
            <div className="hidden md:block h-13" />
            {/* Mobile spacer — thinner h-12 to match the slim app-bar */}
            <div className="block md:hidden h-12" />

            <header
                className={cn(
                    "fixed top-0 z-50 w-full transition-all duration-300",
                    "border-b border-border/60 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 shadow-xs",
                    "mobile-header-slide",
                )}
                data-hidden={isMobileHeaderHidden ? "true" : "false"}
            >
                <div className="flex h-12 md:h-13 w-full items-center justify-between px-3 sm:px-4 md:px-6">
                    <div className="flex min-w-0 items-center gap-3 md:gap-4 lg:gap-6">
                        <Link
                            to="/"
                            onClick={(event) => handleNavigationClick(event, "/")}
                            className="flex shrink-0 items-center gap-2 md:gap-3"
                        >
                            {/* Smaller logo on mobile */}
                            <CareerpathIcon className="h-8 w-8 md:h-10 md:w-10" />

                            <div className="hidden md:block text-base font-semibold text-sidebar-primary">
                                {APP_INFO.APP_NAME}
                            </div>
                        </Link>

                        {/* Mobile: dynamic page title; Desktop: nav links */}
                        <div className="md:hidden min-w-0 flex-1">
                            <MobilePageTitle />
                        </div>

                        <NavigationMenu>
                            <NavigationMenuList className="hidden md:flex">
                                <NavigationItems />
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 md:gap-2">
                        <div className="hidden sm:flex items-center gap-1.5">
                            <ThemeToggle variant="outline" className="h-9 px-2" />
                            <LanguageSwitcher variant="outline" className="h-9 px-2.5" />
                        </div>

                        {auth.isAuthenticated ? (
                            <>
                                {/* Chuông và lửa được gom thành một nhóm */}
                                <div className="flex items-center gap-1">
                                    <NotificationDropdown />
                                    <StreakDropdown />
                                </div>

                                {/* Profile tách nhẹ khỏi nhóm chuông và lửa */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            aria-label="Open user menu"
                                            className="ml-1.5 sm:ml-3 md:ml-4 relative h-8 w-8 md:h-9 md:w-9 rounded-full p-0 transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary ring-offset-2"
                                        >
                                            <Avatar className="h-8 w-8 md:h-9 md:w-9 border border-border/80 shadow-xs ring-1 ring-primary/20">
                                                <AvatarImage
                                                    src={avatarUrl}
                                                    alt={displayName}
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-xs font-bold text-white">
                                                    {initials || <User className="h-4 w-4" />}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent
                                        className="w-60 p-2 rounded-xl border border-border/70 bg-popover/95 backdrop-blur-md shadow-xl animate-scale-in"
                                        align="end"
                                    >
                                        <DropdownMenuLabel className="p-2.5 font-normal">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-border/70 shadow-xs shrink-0 ring-2 ring-primary/20">
                                                    <AvatarImage
                                                        src={avatarUrl}
                                                        alt={displayName}
                                                        className="object-cover"
                                                    />
                                                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-xs font-bold text-white">
                                                        {initials || <User className="h-4 w-4" />}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="truncate text-sm font-bold text-foreground">
                                                            {displayName}
                                                        </p>
                                                        {auth.user?.role_id === 2 ? (
                                                            <span className="shrink-0 rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-700 dark:bg-violet-950/80 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/60">
                                                                Admin
                                                            </span>
                                                        ) : (
                                                            <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                                                                Learner
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="truncate text-xs text-muted-foreground mt-0.5">
                                                        {auth.user?.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </DropdownMenuLabel>

                                        <DropdownMenuSeparator />

                                        <div className="sm:hidden px-2 py-1.5 flex items-center justify-between">
                                            <span className="text-xs text-slate-500 font-medium">Giao diện</span>
                                            <ThemeToggle variant="outline" />
                                        </div>
                                        <div className="sm:hidden px-2 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 mb-1">
                                            <span className="text-xs text-slate-500 font-medium">Ngôn ngữ</span>
                                            <LanguageSwitcher variant="outline" />
                                        </div>

                                        <DropdownMenuItem asChild>
                                            <Link
                                                to="/profile"
                                                onClick={(event) => handleNavigationClick(event, "/profile")}
                                                className="cursor-pointer text-base font-medium flex items-center"
                                            >
                                                <Avatar className="mr-2.5 h-4 w-4 shrink-0 border border-slate-200 dark:border-slate-700">
                                                    <AvatarImage
                                                        src={avatarUrl}
                                                        alt={displayName}
                                                        className="object-cover"
                                                    />
                                                    <AvatarFallback className="bg-blue-600 text-[8px] font-bold text-white">
                                                        {initials ? initials[0] : <User className="h-2.5 w-2.5" />}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span>{t("profile", { ns: "nav", defaultValue: "Profile" })}</span>
                                            </Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem asChild>
                                            <Link
                                                to="/history"
                                                onClick={(event) => handleNavigationClick(event, "/history")}
                                                className="cursor-pointer text-base font-medium"
                                            >
                                                <History className="mr-2 h-4 w-4" />
                                                {t("history", { ns: "nav", defaultValue: "History" })}
                                            </Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem
                                            asChild
                                            disabled={disableStudySettings}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setOpenSetting(true)}
                                                disabled={disableStudySettings}
                                                className="flex w-full cursor-pointer items-center text-base font-medium disabled:cursor-not-allowed"
                                            >
                                                <Settings className="mr-2 h-4 w-4" />
                                                <span>{t("studySettings", { ns: "nav", defaultValue: "Study Settings" })}</span>
                                            </button>
                                        </DropdownMenuItem>

                                        {auth.user?.role_id === 2 && (
                                            <>
                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem asChild>
                                                    <Link
                                                        to="/admin"
                                                        onClick={(event) => handleNavigationClick(event, "/admin")}
                                                        className="cursor-pointer text-base font-medium"
                                                    >
                                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                                        {t("adminPage", { ns: "nav", defaultValue: "Go to admin page" })}
                                                    </Link>
                                                </DropdownMenuItem>
                                            </>
                                        )}

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem
                                            asChild
                                            className="hover:!bg-red-50 dark:hover:!bg-red-950/40"
                                        >
                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="flex w-full cursor-pointer items-center text-base font-medium text-red-600 transition-colors duration-200 hover:!text-red-600"
                                            >
                                                <LogOut className="mr-2 h-4 w-4 text-red-600" />
                                                <span>{t("logout", { ns: "nav", defaultValue: "Log-out" })}</span>
                                            </button>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <Button
                                asChild
                                className="h-9 px-4 text-sm font-semibold shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:shadow-md"
                            >
                                <Link
                                    to="/login"
                                    onClick={(event) => handleNavigationClick(event, "/login")}
                                    className="flex items-center gap-2"
                                >
                                    <span>{t("login", { ns: "nav", defaultValue: "Log-in" })}</span>
                                </Link>
                            </Button>
                        )}

                        {!auth.isAuthenticated && (
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        aria-label="Toggle menu"
                                        className="ml-1 text-sidebar-primary md:hidden"
                                    >
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">
                                            Toggle Menu
                                        </span>
                                    </Button>
                                </SheetTrigger>

                                <SheetContent
                                    side="left"
                                    className="w-[300px] p-0"
                                >
                                    <MobileNav
                                        onNavigateIntent={onNavigateIntent}
                                        avatarUrl={avatarUrl}
                                        displayName={displayName}
                                        initials={initials}
                                    />
                                </SheetContent>
                            </Sheet>
                        )}
                    </div>
                </div>
            </header>

            <Dialog open={openSetting} onOpenChange={setOpenSetting}>
                <StudySettingsDialog
                    studyMinutes={currentMinutes}
                    onCareerClick={() => {
                        setOpenSetting(false);
                        clearResetError();
                        setOpenCareerAlert(true);
                    }}
                    onStudyTimeClick={() => {
                        setOpenSetting(false);
                        setStudyTimeError(null);
                        setOpenStudyTime(true);
                    }}
                />
            </Dialog>

            <AlertDialog
                open={openCareerAlert}
                onOpenChange={(open) => {
                    if (isResetting) {
                        return;
                    }
                    if (!open) {
                        clearResetError();
                    }
                    setOpenCareerAlert(open);
                }}
            >
                <ChangeCareerAlert
                    onCancel={() => {
                        clearResetError();
                        setOpenCareerAlert(false);
                    }}
                    onConfirm={async () => {
                        const didReset = await resetCareerTrack();
                        if (didReset) {
                            setOpenCareerAlert(false);
                        }
                    }}
                    isSubmitting={isResetting}
                    errorMessage={resetError}
                />
            </AlertDialog>

            <Dialog
                open={openStudyTime}
                onOpenChange={(isOpen) => {
                    setOpenStudyTime(isOpen);
                    if (!isOpen) {
                        setNewMinutes(currentMinutes);
                        setStudyTimeError(null);
                    }
                }}
            >
                <StudyTimeDialog
                    open={openStudyTime}
                    currentMinutes={currentMinutes}
                    onCancel={() => {
                        setOpenStudyTime(false);
                        setNewMinutes(currentMinutes);
                    }}
                    onSave={(mins) => {
                        setOpenStudyTime(false);
                        setNewMinutes(mins);
                        setStudyTimeError(null);
                        setOpenStudyTimeAlert(true);
                    }}
                />
            </Dialog>

            <AlertDialog
                open={openStudyTimeAlert}
                onOpenChange={(isOpen) => {
                    setOpenStudyTimeAlert(isOpen);
                    if (!isOpen) {
                        setNewMinutes(currentMinutes);
                    }
                }}
            >
                <StudyTimeAlert
                    currentMinutes={currentMinutes}
                    newMinutes={newMinutes}
                    currentDays={currentDays}
                    newDays={projectedDays}
                    isSaving={isSavingStudyTime}
                    errorMessage={studyTimeError}
                    onCancel={() => {
                        setOpenStudyTimeAlert(false);
                        setNewMinutes(currentMinutes);
                    }}
                    onConfirm={async () => {
                        setIsSavingStudyTime(true);
                        setStudyTimeError(null);
                        try {
                            const updatedProfile = await updateStudySettings({
                                daily_study_minutes: newMinutes,
                            });
                            handleStudySettingsUpdated(updatedProfile);
                            setOpenStudyTimeAlert(false);
                        } catch {
                            setStudyTimeError(
                                "Could not update daily study time. Please try again.",
                            );
                        } finally {
                            setIsSavingStudyTime(false);
                        }
                    }}
                />
            </AlertDialog>

            <AlertDialog
                open={openLogoutConfirm}
                onOpenChange={(open) => {
                    if (isLoggingOut) {
                        return;
                    }
                    setOpenLogoutConfirm(open);
                }}
            >
                <LogoutConfirmDialog
                    onCancel={() => setOpenLogoutConfirm(false)}
                    onConfirm={performLogout}
                    isSubmitting={isLoggingOut}
                />
            </AlertDialog>
        </div>
    );
}

function MobileNav({
    onNavigateIntent,
    avatarUrl,
    displayName,
    initials,
}: {
    onNavigateIntent?: (to: string) => boolean;
    avatarUrl: string;
    displayName: string;
    initials: string;
}) {
    const router = useRouter();
    const navigate = useNavigate();
    const auth = useAuth();
    const { t } = useTranslation(["nav", "profile"]);
    const [openLogoutConfirm, setOpenLogoutConfirm] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = () => {
        setOpenLogoutConfirm(true);
    };

    const performLogout = async () => {
        setIsLoggingOut(true);
        try {
            await auth.logout();
            await router.invalidate();
            await navigate({ to: "/" });
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setIsLoggingOut(false);
            setOpenLogoutConfirm(false);
        }
    };

    const linkClass =
        "flex items-center rounded-lg px-3 py-2 text-base transition-colors hover:bg-accent hover:text-accent-foreground";

    const handleNavigationClick = (
        event: ReactMouseEvent<HTMLElement>,
        to: string,
    ) => {
        if (!onNavigateIntent) {
            return;
        }

        const handled = onNavigateIntent(to);
        if (handled) {
            event.preventDefault();
        }
    };

    return (
        <>
            <div className="flex h-full flex-col">
                <div className="border-b px-6 py-4">
                    <Link
                        to="/"
                        onClick={(event) => handleNavigationClick(event, "/")}
                        className="flex items-center gap-3"
                    >
                        <TmaLogo className="h-8 w-8" />

                        <div className="text-lg font-bold text-sidebar-primary">
                            {APP_INFO.APP_NAME}{" "}
                            <span className="text-black dark:text-white">TOEIC</span>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 space-y-1 px-6 py-4">
                    <Link
                        to="/"
                        onClick={(event) => handleNavigationClick(event, "/")}
                        className={linkClass}
                        activeProps={{
                            className:
                                "bg-accent text-accent-foreground font-semibold",
                        }}
                    >
                        {t("home", { ns: "nav", defaultValue: "Home" })}
                    </Link>

                    <Link
                        to="/lessons/learning-path"
                        onClick={(event) => handleNavigationClick(event, "/lessons/learning-path")}
                        className={linkClass}
                        activeProps={{
                            className:
                                "bg-accent text-accent-foreground font-semibold",
                        }}
                    >
                        {t("path", { ns: "nav", defaultValue: "Path" })}
                    </Link>

                    <Link
                        to="/guide"
                        onClick={(event) => handleNavigationClick(event, "/guide")}
                        className={linkClass}
                        activeProps={{
                            className:
                                "bg-accent text-accent-foreground font-semibold",
                        }}
                    >
                        {t("howItWorks", { ns: "nav", defaultValue: "How It Works" })}
                    </Link>
                </nav>

                <div className="border-t border-slate-200 px-6 py-3 space-y-3 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {t("theme.theme", { ns: "nav", defaultValue: "Theme" })}
                        </span>
                        <ThemeToggle variant="outline" showLabel />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Language</span>
                        <LanguageSwitcher variant="outline" />
                    </div>
                </div>

                {auth.isAuthenticated ? (
                    <div className="space-y-1 border-t px-6 py-4">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <Avatar className="h-10 w-10 border border-slate-200 shadow-xs dark:border-slate-800 shrink-0">
                                <AvatarImage
                                    src={avatarUrl}
                                    alt={displayName}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-xs font-bold text-white">
                                    {initials || <User className="h-4 w-4" />}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-base font-semibold">
                                    {displayName}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {auth.user?.email}
                                </p>
                            </div>
                        </div>

                        <Link
                            to="/profile"
                            onClick={(event) => handleNavigationClick(event, "/profile")}
                            className={cn(linkClass, "gap-2.5")}
                            activeProps={{
                                className:
                                    "bg-accent text-accent-foreground font-semibold",
                            }}
                        >
                            <Avatar className="h-4 w-4 shrink-0 border border-slate-200 dark:border-slate-700">
                                <AvatarImage
                                    src={avatarUrl}
                                    alt={displayName}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-blue-600 text-[8px] font-bold text-white">
                                    {initials ? initials[0] : <User className="h-2.5 w-2.5" />}
                                </AvatarFallback>
                            </Avatar>
                            <span>{t("profile", { ns: "nav", defaultValue: "Profile" })}</span>
                        </Link>

                        <Link
                            to="/history"
                            onClick={(event) => handleNavigationClick(event, "/history")}
                            className={cn(linkClass, "gap-2")}
                            activeProps={{
                                className:
                                    "bg-accent text-accent-foreground font-semibold",
                            }}
                        >
                            <History className="h-4 w-4" />
                            {t("history", { ns: "nav", defaultValue: "History" })}
                        </Link>

                        {auth.user?.role_id === 2 && (
                            <Link
                                to="/admin"
                                onClick={(event) => handleNavigationClick(event, "/admin")}
                                className={cn(linkClass, "gap-2")}
                                activeProps={{
                                    className:
                                        "bg-accent text-accent-foreground font-semibold",
                                }}
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                {t("adminPage", { ns: "nav", defaultValue: "Go to admin page" })}
                            </Link>
                        )}

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-base text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>{t("logout", { ns: "nav", defaultValue: "Log out" })}</span>
                        </button>
                    </div>
                ) : (
                    <div className="border-t px-6 py-4">
                        <Button asChild variant="outline" className="w-full">
                            <Link
                                to="/login"
                                onClick={(event) => handleNavigationClick(event, "/login")}
                                className="flex items-center justify-center gap-2"
                            >
                                <User className="h-4 w-4" />
                                <span>{t("login", { ns: "nav", defaultValue: "Login" })}</span>
                            </Link>
                        </Button>
                    </div>
                )}
            </div>

            <AlertDialog
                open={openLogoutConfirm}
                onOpenChange={(open) => {
                    if (isLoggingOut) {
                        return;
                    }
                    setOpenLogoutConfirm(open);
                }}
            >
                <LogoutConfirmDialog
                    onCancel={() => setOpenLogoutConfirm(false)}
                    onConfirm={performLogout}
                    isSubmitting={isLoggingOut}
                />
            </AlertDialog>

            <MobileBottomBar />
        </>
    );
}
