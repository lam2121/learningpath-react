import { Link, useRouter, useNavigate } from "@tanstack/react-router"
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/shadcn/component/ui/navigation-menu"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shadcn/component/ui/dropdown-menu"
import { Button } from "../../shadcn/component/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/shadcn/component/ui/sheet"
import { Menu, LogOut, History, User, Flame, Bell } from "lucide-react"
import { useAuth } from "@/common/context/AuthContext"
import { cn } from "@/shadcn/lib/util"
import { TmaLogo } from "./TmaLogo"
<<<<<<< HEAD
import { APP_INFO} from "../../const/appConst"
=======
import { APP_INFO } from "../const/appConst"
>>>>>>> 9b9ffe8 (chore:password requirements)
import { UpskillsIcon } from "../../common/component/SocialMediaIcon";
import { StreakDropdown } from "@/feature/user-profile/component/StreakDropdown";
import { NotificationDropdown } from "@/feature/user-profile/component/NotificationDropdown";
export function MainNavigationMenu() {
    const router = useRouter()
    const navigate = useNavigate()
    const auth = useAuth()

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            try {
                auth.logout()
                await router.invalidate()
                await navigate({ to: '/login' })
            } catch (error) {
                console.error('Logout error:', error)
            }
        }
    }

    const NavigationItems = () => (
        <>
            <NavigationMenuItem>
                <NavigationMenuLink asChild>
                    <Link
                        to="/"
                        className="!text-base !bg-white px-4 py-2 font-medium"
                    >
                        Home
                    </Link>
                </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
                <NavigationMenuLink asChild>
                    <Link
                        to="/test"
                        className="!text-base !bg-white px-4 py-2 font-medium"
                    >
                        Tests
                    </Link>
                </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
                <NavigationMenuLink asChild>
                    <Link
                        to="/guide"
                        className="!text-base !bg-white px-4 py-2 font-medium"
                    >
                        How It Works
                    </Link>
                </NavigationMenuLink>
            </NavigationMenuItem>
        </>
    )

    return (
        <div>
            <div className="h-13"></div>
            <header className="bg-white top-0 w-full border-b-1 border-b-gray-300 fixed z-50">
                <div className="flex items-center justify-between h-13 px-6 py-3">
                    <div className="flex items-center space-x-6">

                        <Link to={"/"} className="flex items-center space-x-3">
                            <UpskillsIcon className="w-10 h-10" />
                            <div className="font-semibold text-base text-sidebar-primary">{APP_INFO.APP_NAME} <span className="text-black"></span></div>
                        </Link>

                        <NavigationMenu>
                            <NavigationMenuList className="hidden md:flex">
                                <NavigationItems />
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>
                    <div className="flex items-center gap-6">
                        <NotificationDropdown />

                        <StreakDropdown />
                        {auth.isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="text-[15px] flex items-center space-x-2"
                                    >
                                        <User className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-52" align="end">
                                    <DropdownMenuLabel className="text-center">
                                        <div className="space-y-1">
                                            <p className="text-base font-semibold">{auth.user?.username || 'User'}</p>
                                            <p className="text-xs text-muted-foreground">{auth.user?.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link to="/history" className="font-medium text-base cursor-pointer">
                                            <History className="mr-2 w-4 h-4" />
                                            History
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild className="hover:!bg-red-50">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full font-medium text-base cursor-pointer text-red-600 hover:!text-red-600 transition-colors duration-200"
                                        >
                                            <LogOut className="mr-2 w-4 h-4 text-red-600" />
                                            <span>Log-out</span>
                                        </button>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Button asChild variant="outline" className="text-[15px]">
                                    <Link to="/login" className="flex items-center space-x-2">
                                        <span>Log-in</span>
                                    </Link>
                                </Button>
                            </div>
                        )}

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="md:hidden text-sidebar-primary"
                                >
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle Menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] p-0">
                                <MobileNav />
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>
        </div>
    )
}

function MobileNav() {
    const router = useRouter()
    const navigate = useNavigate()
    const auth = useAuth()

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            try {
                auth.logout()
                await router.invalidate()
                await navigate({ to: '/' })
            } catch (error) {
                console.error('Logout error:', error)
            }
        }
    }

    const linkClass = "flex items-center px-3 py-2 text-base rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground";

    return (
        <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b">
                <Link to="/" className="flex items-center space-x-3">
                    <TmaLogo className="w-8 h-8" />
                    <div className="font-bold text-lg text-sidebar-primary">
                        {APP_INFO.APP_NAME} <span className="text-black">TOEIC</span>
                    </div>
                </Link>
            </div>

            <nav className="flex-1 px-6 py-4 space-y-1">
                <Link to="/" className={linkClass} activeProps={{ className: "bg-accent text-accent-foreground font-semibold" }}>
                    Home
                </Link>

                <Link to="/test" className={linkClass} activeProps={{ className: "bg-accent text-accent-foreground font-semibold" }}>
                    Test
                </Link>

                <Link to="/guide" className={linkClass} activeProps={{ className: "bg-accent text-accent-foreground font-semibold" }}>
                    Learning Hub
                </Link>
            </nav>

            {auth.isAuthenticated && (
                <div className="border-t px-6 py-4 space-y-1">
                    <div className="px-3 py-2">
                        <p className="text-base font-semibold">{auth.user?.username || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{auth.user?.email}</p>
                    </div>

                    <Link to="/history" className={cn(linkClass, "gap-2")} activeProps={{ className: "bg-accent text-accent-foreground font-semibold" }}>
                        <History className="w-4 h-4" /> History
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3 py-2 text-base rounded-lg transition-colors hover:bg-red-50 text-red-600 hover:text-red-700"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Log out</span>
                    </button>
                </div>
            )}

            {!auth.isAuthenticated && (
                <div className="border-t px-6 py-4">
                    <Button asChild variant="outline" className="w-full">
                        <Link to="/login" className="flex items-center justify-center gap-2">
                            <User className="w-4 h-4" /> <span>Login</span>
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    )
}