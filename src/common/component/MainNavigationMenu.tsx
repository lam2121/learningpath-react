import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
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
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/shadcn/component/ui/sheet";
import {
    CircleUser,
    History,
    LogOut,
    Menu,
    Settings,
    User,
} from "lucide-react";
import { useAuth } from "@/common/context/AuthContext";
import {
    fetchCurrentUserProfile,
    updateStudySettings,
} from "@/feature/auth/api/authAPI";
import type { UserProfileResponse } from "@/feature/auth/type/Auth";
import { ChangeCareerAlert } from "@/feature/user-profile/component/ChangeCareerAlert";
import { StudySettingsDialog } from "@/feature/user-profile/component/StudySettingsDialog";
import { StudyTimeAlert } from "@/feature/user-profile/component/StudyTimeAlert";
import { StudyTimeDialog } from "@/feature/user-profile/component/StudyTimeDialog";
import { cn } from "@/shadcn/lib/util";
import { TmaLogo } from "./TmaLogo";
import { APP_INFO } from "../const/appConst";
import { CareerpathIcon } from "../../common/component/SocialMediaIcon";
import { StreakDropdown } from "@/feature/user-profile/component/StreakDropdown";
import { NotificationDropdown } from "@/feature/user-profile/component/NotificationDropdown";

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
    const router = useRouter();
    const navigate = useNavigate();
    const auth = useAuth();
    const userId = Number(auth.user?.id);
    const [openSetting, setOpenSetting] = useState(false);
    const [openCareerAlert, setOpenCareerAlert] = useState(false);
    const [openStudyTime, setOpenStudyTime] = useState(false);
    const [openStudyTimeAlert, setOpenStudyTimeAlert] = useState(false);
    const [currentHour, setCurrentHour] = useState(2);
    const [newHour, setNewHour] = useState(2);
    const [totalEstimatedMinutes, setTotalEstimatedMinutes] = useState(0);
    const [isSavingStudyTime, setIsSavingStudyTime] = useState(false);
    const [studyTimeError, setStudyTimeError] = useState<string | null>(null);

    useEffect(() => {
        if (!Number.isFinite(userId)) {
            setCurrentHour(2);
            setNewHour(2);
            setTotalEstimatedMinutes(0);
            return;
        }

        let isMounted = true;

        const loadProfile = async () => {
            try {
                const profile = await fetchCurrentUserProfile();
                if (!isMounted) {
                    return;
                }

                const hours = Math.max(1, Math.round(profile.daily_study_minutes / 60));
                setCurrentHour(hours);
                setNewHour(hours);
                setTotalEstimatedMinutes(profile.total_estimated_minutes);
            } catch {
                if (!isMounted) {
                    return;
                }

                setCurrentHour(2);
                setNewHour(2);
                setTotalEstimatedMinutes(0);
            }
        };

        void loadProfile();

        const handleProfileUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<UserProfileResponse>;
            if (!isMounted) {
                return;
            }

            const hours = Math.max(1, Math.round(customEvent.detail.daily_study_minutes / 60));
            setCurrentHour(hours);
            setNewHour(hours);
            setTotalEstimatedMinutes(customEvent.detail.total_estimated_minutes);
        };

        window.addEventListener("careerpath:profile-updated", handleProfileUpdated);

        return () => {
            isMounted = false;
            window.removeEventListener("careerpath:profile-updated", handleProfileUpdated);
        };
    }, [userId]);

    const handleLogout = async () => {
        if (!window.confirm("Are you sure you want to logout?")) {
            return;
        }

        try {
            auth.logout();
            await router.invalidate();
            await navigate({ to: "/" });
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const currentDays = estimateDays(totalEstimatedMinutes, currentHour * 60);
    const projectedDays = estimateDays(totalEstimatedMinutes, newHour * 60);

    const handleStudySettingsUpdated = (profile: UserProfileResponse) => {
        const hours = Math.max(1, Math.round(profile.daily_study_minutes / 60));
        setCurrentHour(hours);
        setNewHour(hours);
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

    const NavigationItems = () => (
        <>
            <NavigationMenuItem>
                <NavigationMenuLink asChild>
                    <Link
                        to="/"
                        onClick={(event) => handleNavigationClick(event, "/")}
                        className="!bg-white px-4 py-2 !text-base font-medium"
                    >
                        Home
                    </Link>
                </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
                <NavigationMenuLink asChild>
                    <Link
                        to="/lessons/learning-path"
                        onClick={(event) => handleNavigationClick(event, "/lessons/learning-path")}
                        className="!bg-white px-4 py-2 !text-base font-medium"
                    >
                        Path
                    </Link>
                </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
                <NavigationMenuLink asChild>
                    <Link
                        to="/guide"
                        onClick={(event) => handleNavigationClick(event, "/guide")}
                        className="!bg-white px-4 py-2 !text-base font-medium"
                    >
                        How It Works
                    </Link>
                </NavigationMenuLink>
            </NavigationMenuItem>
        </>
    );

    return (
        <div>
            <div className="h-13" />

            <header className="fixed top-0 z-50 w-full border-b border-gray-300 bg-white">
                <div className="flex h-13 w-full items-center justify-between px-4 py-3 sm:px-6">
                    <div className="flex min-w-0 items-center gap-4 lg:gap-6">
                        <Link
                            to="/"
                            onClick={(event) => handleNavigationClick(event, "/")}
                            className="flex shrink-0 items-center gap-3"
                        >
                            <CareerpathIcon className="h-10 w-10" />

                            <div className="hidden text-base font-semibold text-sidebar-primary sm:block">
                                {APP_INFO.APP_NAME}
                            </div>
                        </Link>

                        <NavigationMenu>
                            <NavigationMenuList className="hidden md:flex">
                                <NavigationItems />
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    <div className="flex shrink-0 items-center">
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
                                            variant="outline"
                                            aria-label="Open user menu"
                                            className="ml-3 flex items-center px-3 text-[15px] sm:ml-4"
                                        >
                                            <User className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent
                                        className="w-52"
                                        align="end"
                                    >
                                        <DropdownMenuLabel className="text-center">
                                            <div className="space-y-1">
                                                <p className="text-base font-semibold">
                                                    {auth.user?.username ||
                                                        "User"}
                                                </p>

                                                <p className="text-xs text-muted-foreground">
                                                    {auth.user?.email}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem asChild>
                                            <Link
                                                to="/profile"
                                                onClick={(event) => handleNavigationClick(event, "/profile")}
                                                className="cursor-pointer text-base font-medium"
                                            >
                                                <CircleUser className="mr-2 h-4 w-4" />
                                                Profile
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
                                                History
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
                                                <span>Study Settings</span>
                                            </button>
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem
                                            asChild
                                            className="hover:!bg-red-50"
                                        >
                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="flex w-full cursor-pointer items-center text-base font-medium text-red-600 transition-colors duration-200 hover:!text-red-600"
                                            >
                                                <LogOut className="mr-2 h-4 w-4 text-red-600" />
                                                <span>Log-out</span>
                                            </button>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <Button
                                asChild
                                variant="outline"
                                className="text-[15px]"
                            >
                                <Link
                                    to="/login"
                                    onClick={(event) => handleNavigationClick(event, "/login")}
                                    className="flex items-center gap-2"
                                >
                                    <span>Log-in</span>
                                </Link>
                            </Button>
                        )}

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
                                <MobileNav onNavigateIntent={onNavigateIntent} />
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>

            <Dialog open={openSetting} onOpenChange={setOpenSetting}>
                <StudySettingsDialog
                    studyHours={currentHour}
                    onCareerClick={() => {
                        setOpenSetting(false);
                        setOpenCareerAlert(true);
                    }}
                    onStudyTimeClick={() => {
                        setOpenSetting(false);
                        setStudyTimeError(null);
                        setOpenStudyTime(true);
                    }}
                />
            </Dialog>

            <AlertDialog open={openCareerAlert} onOpenChange={setOpenCareerAlert}>
                <ChangeCareerAlert
                    onCancel={() => setOpenCareerAlert(false)}
                    onConfirm={() => {
                        setOpenCareerAlert(false);
                    }}
                />
            </AlertDialog>

            <Dialog open={openStudyTime} onOpenChange={setOpenStudyTime}>
                <StudyTimeDialog
                    currentHour={currentHour}
                    onCancel={() => setOpenStudyTime(false)}
                    onSave={(hour) => {
                        setOpenStudyTime(false);
                        setNewHour(hour);
                        setStudyTimeError(null);
                        setOpenStudyTimeAlert(true);
                    }}
                />
            </Dialog>

            <AlertDialog open={openStudyTimeAlert} onOpenChange={setOpenStudyTimeAlert}>
                <StudyTimeAlert
                    currentHour={currentHour}
                    newHour={newHour}
                    currentDays={currentDays}
                    newDays={projectedDays}
                    isSaving={isSavingStudyTime}
                    errorMessage={studyTimeError}
                    onCancel={() => setOpenStudyTimeAlert(false)}
                    onConfirm={async () => {
                        setIsSavingStudyTime(true);
                        setStudyTimeError(null);
                        try {
                            const updatedProfile = await updateStudySettings({
                                daily_study_minutes: newHour * 60,
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
        </div>
    );
}

function MobileNav({
    onNavigateIntent,
}: {
    onNavigateIntent?: (to: string) => boolean;
}) {
    const router = useRouter();
    const navigate = useNavigate();
    const auth = useAuth();

    const handleLogout = async () => {
        if (!window.confirm("Are you sure you want to logout?")) {
            return;
        }

        try {
            auth.logout();
            await router.invalidate();
            await navigate({ to: "/" });
        } catch (error) {
            console.error("Logout error:", error);
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
                        <span className="text-black">TOEIC</span>
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
                    Home
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
                    Path
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
                    How It Works
                </Link>
            </nav>

            {auth.isAuthenticated ? (
                <div className="space-y-1 border-t px-6 py-4">
                    <div className="px-3 py-2">
                        <p className="text-base font-semibold">
                            {auth.user?.username || "User"}
                        </p>

                        <p className="text-xs text-muted-foreground">
                            {auth.user?.email}
                        </p>
                    </div>

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
                        History
                    </Link>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-base text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Log out</span>
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
                            <span>Login</span>
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
