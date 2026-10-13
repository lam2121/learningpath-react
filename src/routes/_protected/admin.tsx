import { createFileRoute, Outlet, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
	LayoutDashboard,
	Settings,
	AlertTriangle,
	DollarSign,
	Shield,
	ScrollText,
	Users,
	GraduationCap,
	Loader2,
	LogOut,
} from 'lucide-react'
import { useAuth } from '@/common/context/AuthContext'
import { ThemeToggle } from '@/common/component/ThemeToggle'
import { Button } from '@/shadcn/component/ui/button'
import {
	fetchOnboardingStatus,
	getCachedOnboardingStatus,
} from '@/feature/onboarding/api/onboardingApi'

const navigation = [
	{ key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
	{ key: 'tracks', label: 'Career Tracks', icon: Settings, href: '/admin/tracks' },
	{ key: 'users', label: 'Users', icon: Users, href: '/admin/users' },
	{ key: 'costs', label: 'AI Costs', icon: DollarSign, href: '/admin/costs' },
	{ key: 'usagelogs', label: 'AI Usage Logs', icon: ScrollText, href: '/admin/usage-logs' },
	{ key: 'rejected', label: 'Rejected Content', icon: AlertTriangle, href: '/admin/rejected' },
	{ key: 'killswitch', label: 'Kill Switch', icon: Shield, href: '/admin/killswitch' },
]

function AdminSidebar({
	onGoToLearning,
	onSignOut,
	goingToLearning,
}: {
	onGoToLearning: () => void;
	onSignOut: () => void;
	goingToLearning: boolean;
}) {
	return (
		<aside className="hidden md:flex w-64 bg-card border-r border-border h-screen sticky top-0 flex-col shrink-0">
			<div className="p-6 border-b border-border">
				<div className="flex items-center gap-2.5">
					<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
						<Shield className="h-5 w-5" />
					</div>
					<div>
						<h1 className="text-lg font-bold font-display text-foreground leading-tight">Admin Portal</h1>
						<p className="text-xs text-muted-foreground">AI Learning Path</p>
					</div>
				</div>
			</div>
			<nav className="flex-1 p-3.5 space-y-1 overflow-y-auto min-h-0">
				{navigation.map(item => (
					<Link
						key={item.key}
						to={item.href}
						activeOptions={{ exact: true }}
						activeProps={{ className: 'bg-primary/10 text-primary font-semibold border-primary/25 shadow-2xs' }}
						className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent transition-colors text-sm"
					>
						<item.icon className="h-4 w-4" />
						<span className="font-medium">{item.label}</span>
					</Link>
				))}
			</nav>
			<div className="mt-auto p-4 border-t border-border space-y-1.5">
				<div className="flex items-center justify-between px-3 py-1.5 rounded-xl">
					<span className="text-xs font-medium text-muted-foreground">Theme</span>
					<ThemeToggle variant="outline" className="h-8 w-8" />
				</div>
				<button
					type="button"
					onClick={onGoToLearning}
					disabled={goingToLearning}
					className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-colors disabled:opacity-60 cursor-pointer"
				>
					{goingToLearning ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<GraduationCap className="h-4 w-4" />
					)}
					<span>Go to Learning</span>
				</button>
				<button
					type="button"
					onClick={onSignOut}
					className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-transparent hover:border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
				>
					<LogOut className="h-4 w-4" />
					<span>Sign Out</span>
				</button>
			</div>
		</aside>
	)
}

export const Route = createFileRoute('/_protected/admin')({
	beforeLoad: ({ context }) => {
		const roleId = Number(context.auth.user?.role_id);
		const roleStr = String(context.auth.user?.role || '').trim().toLowerCase();
		const isAdmin = roleId === 2 || roleStr === 'admin' || roleStr === 'administrator';

		if (!isAdmin) {
			throw redirect({ to: '/onboarding/role-selection' })
		}
	},
	component: AdminLayout,
})

function AdminLayout() {
	const { logout, user } = useAuth()
	const navigate = useNavigate()
	const [goingToLearning, setGoingToLearning] = useState(false)

	const handleSignOut = async () => {
		await logout()
		navigate({ to: '/login' })
	}

	const handleGoToLearning = async () => {
		setGoingToLearning(true)
		try {
			let enrolled: boolean
			try {
				const status = await fetchOnboardingStatus()
				enrolled = status.learning_status === 'enrolled'
			} catch {
				enrolled = getCachedOnboardingStatus(user?.id ? Number(user.id) : null) === 'enrolled'
			}
			await navigate({ to: enrolled ? '/profile' : '/onboarding/role-selection' })
		} finally {
			setGoingToLearning(false)
		}
	}

	return (
		<div className="flex flex-col md:flex-row min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground">
			{/* Mobile Admin Header with prominent Log Out button */}
			<header className="md:hidden sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border/80 px-3.5 py-2.5 pt-[max(0.6rem,env(safe-area-inset-top))] flex items-center justify-between gap-2 shadow-2xs">
				<div className="flex items-center gap-2 min-w-0">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
						<Shield className="h-4 w-4" />
					</div>
					<div className="min-w-0">
						<h1 className="text-sm font-bold font-display tracking-tight text-foreground truncate">Admin Portal</h1>
						<p className="text-[10px] text-muted-foreground truncate">{user?.email || 'Administrator'}</p>
					</div>
				</div>
				<div className="flex items-center gap-1.5 shrink-0">
					<Button
						variant="ghost"
						size="sm"
						onClick={handleGoToLearning}
						disabled={goingToLearning}
						className="h-8 px-2 text-xs font-semibold text-primary hover:bg-primary/10 cursor-pointer"
						title="Go to Learning"
					>
						{goingToLearning ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<GraduationCap className="h-3.5 w-3.5" />
						)}
						<span className="hidden xs:inline ml-1">Learn</span>
					</Button>
					<ThemeToggle variant="outline" className="h-8 w-8" />
					<Button
						variant="outline"
						size="sm"
						onClick={handleSignOut}
						className="h-8 px-2.5 gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer shadow-2xs"
						title="Sign Out"
					>
						<LogOut className="h-3.5 w-3.5" />
						<span>Sign Out</span>
					</Button>
				</div>
			</header>

			{/* Mobile Horizontal Navigation Tabs with clean scroll-snap and no scrollbar */}
			<div className="md:hidden bg-card/90 backdrop-blur-md border-b border-border/80 px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
				{navigation.map(item => (
					<Link
						key={item.key}
						to={item.href}
						activeOptions={{ exact: true }}
						activeProps={{ className: 'bg-primary/15 text-primary font-bold border-primary/30 shadow-2xs' }}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 whitespace-nowrap border border-transparent shrink-0 transition-colors"
					>
						<item.icon className="h-3.5 w-3.5" />
						<span>{item.label}</span>
					</Link>
				))}
			</div>

			<AdminSidebar
				onGoToLearning={handleGoToLearning}
				onSignOut={handleSignOut}
				goingToLearning={goingToLearning}
			/>
			<main className="flex-1 w-full max-w-full min-w-0 p-3 sm:p-5 lg:p-8 overflow-x-hidden">
				<Outlet />
			</main>
		</div>
	)
}
