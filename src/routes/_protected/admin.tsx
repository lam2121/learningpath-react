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
		<aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0 flex flex-col">
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
					className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-700 dark:hover:text-blue-300 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-colors disabled:opacity-60"
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
					className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700 dark:hover:text-red-300 border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-colors"
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
		<div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
			<AdminSidebar />
			<main className="flex-1 p-6 lg:p-8">
				<Outlet />
			</main>
		</div>
	)
}
