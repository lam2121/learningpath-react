import { createFileRoute, Outlet, Link, redirect, useNavigate } from '@tanstack/react-router'
import { LayoutDashboard, Settings, AlertTriangle, DollarSign, Shield, ScrollText, LogOut } from 'lucide-react'
import { useAuth } from '@/common/context/AuthContext'

const navigation = [
	{ key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
	{ key: 'tracks', label: 'Career Tracks', icon: Settings, href: '/admin/tracks' },
	{ key: 'costs', label: 'AI Costs', icon: DollarSign, href: '/admin/costs' },
	{ key: 'usagelogs', label: 'AI Usage Logs', icon: ScrollText, href: '/admin/usage-logs' },
	{ key: 'rejected', label: 'Rejected Content', icon: AlertTriangle, href: '/admin/rejected' },
	{ key: 'killswitch', label: 'Kill Switch', icon: Shield, href: '/admin/killswitch' },
]

function AdminSidebar() {
	const { logout } = useAuth()
	const navigate = useNavigate()

	const handleSignOut = () => {
		logout()
		navigate({ to: '/login' })
	}

	return (
		<aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
			<div className="p-6 border-b border-gray-100">
				<h1 className="text-xl font-bold text-gray-900">Admin Portal</h1>
				<p className="text-xs text-gray-500 mt-1">TMA IT Communication</p>
			</div>
			<nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
				{navigation.map(item => (
					<Link
						key={item.key}
						to={item.href}
						activeOptions={{ exact: true }}
						activeProps={{ className: 'bg-blue-50 text-blue-700 border-blue-200' }}
						className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 border transition-colors"
					>
						<item.icon className="h-5 w-5" />
						<span className="font-medium">{item.label}</span>
					</Link>
				))}
			</nav>
			<div className="mt-auto p-4 border-t border-gray-100">
				<button
					onClick={handleSignOut}
					className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 transition-colors"
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
		<div className="flex min-h-screen bg-gray-50">
			<AdminSidebar />
			<main className="flex-1 p-6 lg:p-8">
				<Outlet />
			</main>
		</div>
	)
}
