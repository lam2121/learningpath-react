import { createFileRoute, Outlet, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { LayoutDashboard, Settings, AlertTriangle, DollarSign, Shield, ScrollText, Users, GraduationCap, Loader2, LogOut } from 'lucide-react'
import { useAuth } from '@/common/context/AuthContext'
import { ThemeToggle } from '@/common/component/ThemeToggle'
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

function AdminSidebar() {
	const { logout, user } = useAuth()
	const navigate = useNavigate()
	const [goingToLearning, setGoingToLearning] = useState(false)

	const handleSignOut = async () => {
		await logout()
		navigate({ to: '/login' })
	}

	// Same destination logic the learner login uses: enrolled learners resume at
	// their profile, everyone else starts at role selection.
	const handleGoToLearning = async () => {
		setGoingToLearning(true)
		try {
			let enrolled: boolean
			try {
				const status = await fetchOnboardingStatus()
				enrolled = status.learning_status === 'enrolled'
			} catch {
				// Server unreachable - fall back to the cached status like LoginForm does.
				enrolled = getCachedOnboardingStatus(user?.id ? Number(user.id) : null) === 'enrolled'
			}
			await navigate({ to: enrolled ? '/profile' : '/onboarding/role-selection' })
		} finally {
			setGoingToLearning(false)
		}
	}

	return (
		<aside className="hidden md:flex w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0 flex-col shrink-0">
			<div className="p-6 border-b border-gray-100 dark:border-gray-800">
				<h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Admin Portal</h1>
				<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">AI Learning Path</p>
			</div>
			<nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
				{navigation.map(item => (
					<Link
						key={item.key}
						to={item.href}
						activeOptions={{ exact: true }}
						activeProps={{ className: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' }}
						className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 border border-transparent transition-colors"
					>
						<item.icon className="h-5 w-5" />
						<span className="font-medium">{item.label}</span>
					</Link>
				))}
			</nav>
			<div className="mt-auto p-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
				<div className="flex items-center gap-3 px-3 py-2 rounded-lg">
					<span className="text-sm font-medium text-gray-600 dark:text-gray-400">Theme</span>
					<ThemeToggle variant="outline" className="ml-auto" />
				</div>
				<button
					onClick={handleGoToLearning}
					disabled={goingToLearning}
					className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-700 dark:hover:text-blue-300 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-colors disabled:opacity-60 cursor-pointer"
				>
					{goingToLearning ? (
						<Loader2 className="h-5 w-5 animate-spin" />
					) : (
						<GraduationCap className="h-5 w-5" />
					)}
					<span className="font-medium">Go to Learning</span>
				</button>
				<button
					onClick={handleSignOut}
					className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700 dark:hover:text-red-300 border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-colors cursor-pointer"
				>
					<LogOut className="h-5 w-5" />
					<span className="font-medium">Sign Out</span>
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
	return (
		<div className="flex flex-col md:flex-row min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
			{/* Mobile Admin Header */}
			<header className="md:hidden sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2.5 pt-[max(0.6rem,env(safe-area-inset-top))] flex items-center justify-between shadow-2xs">
				<div>
					<h1 className="text-base font-bold text-gray-900 dark:text-gray-100">Admin Portal</h1>
					<p className="text-[10px] text-gray-500">AI Learning Path</p>
				</div>
				<ThemeToggle variant="outline" className="h-8 w-8" />
			</header>

			{/* Mobile Horizontal Navigation Tabs */}
			<div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-2 py-1.5 flex items-center gap-1 overflow-x-auto">
				{navigation.map(item => (
					<Link
						key={item.key}
						to={item.href}
						activeOptions={{ exact: true }}
						activeProps={{ className: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold border-blue-200 dark:border-blue-800' }}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap border border-transparent shrink-0"
					>
						<item.icon className="h-3.5 w-3.5" />
						<span>{item.label}</span>
					</Link>
				))}
			</div>

			<AdminSidebar />
			<main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-[100vw] overflow-x-hidden">
				<Outlet />
			</main>
		</div>
	)
}
