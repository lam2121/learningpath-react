import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/shadcn/component/ui/navigation-menu";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shadcn/component/ui/dropdown-menu";
import { Button } from "../../shadcn/component/ui/button";
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
    User,
} from "lucide-react";
import { useAuth } from "@/common/context/AuthContext";
import { cn } from "@/shadcn/lib/util";
import { TmaLogo } from "./TmaLogo";
import { APP_INFO } from "../const/appConst";
import { CareerpathIcon } from "../../common/component/SocialMediaIcon";
import { StreakDropdown } from "@/feature/user-profile/component/StreakDropdown";
import { NotificationDropdown } from "@/feature/user-profile/component/NotificationDropdown";

export function MainNavigationMenu() {
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

    const NavigationItems = () => (
        <>
            <NavigationMenuItem>
                <NavigationMenuLink asChild>
                    <Link
                        to="/home"
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
                            to="/home"
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
                                                className="cursor-pointer text-base font-medium"
                                            >
                                                <History className="mr-2 h-4 w-4" />
                                                History
                                            </Link>
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
                                <MobileNav />
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>
        </div>
    );
}

function MobileNav() {
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

    return (
        <div className="flex h-full flex-col">
            <div className="border-b px-6 py-4">
                <Link to="/" className="flex items-center gap-3">
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
                    className={linkClass}
                    activeProps={{
                        className:
                            "bg-accent text-accent-foreground font-semibold",
                    }}
                >
                    Home
                </Link>

                <Link
                    to="/test"
                    className={linkClass}
                    activeProps={{
                        className:
                            "bg-accent text-accent-foreground font-semibold",
                    }}
                >
                    Test
                </Link>

                <Link
                    to="/guide"
                    className={linkClass}
                    activeProps={{
                        className:
                            "bg-accent text-accent-foreground font-semibold",
                    }}
                >
                    Learning Hub
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