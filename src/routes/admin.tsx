import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import { LayoutDashboard, Settings, AlertTriangle, DollarSign, Shield } from 'lucide-react'

const navigation = [
	{ key: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, href: '/admin' },
	{ key: 'tracks', label: 'Career Tracks', icon: Settings, href: '/admin/tracks' },
	{ key: 'costs', label: 'Chi phí AI', icon: DollarSign, href: '/admin/costs' },
	{ key: 'rejected', label: 'Rejected Content', icon: AlertTriangle, href: '/admin/rejected' },
	{ key: 'killswitch', label: 'Kill Switch', icon: Shield, href: '/admin/killswitch' },
]

function AdminSidebar() {
	return (
		<aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
			<div className="p-6 border-b border-gray-100">
				<h1 className="text-xl font-bold text-gray-900">Admin Portal</h1>
				<p className="text-xs text-gray-500 mt-1">TMA IT Communication</p>
			</div>
			<nav className="p-4 space-y-1">
				{navigation.map(item => (
					<Link
						key={item.key}
						to={item.href}
						activeProps={{ className: 'bg-blue-50 text-blue-700 border-blue-200' }}
						className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 border transition-colors"
					>
						<item.icon className="h-5 w-5" />
						<span className="font-medium">{item.label}</span>
					</Link>
				))}
			</nav>
		</aside>
	)
}

export const Route = createFileRoute('/admin')({
	component: () => (
		<div className="flex min-h-screen bg-gray-50">
			<AdminSidebar />
			<main className="flex-1 p-6 lg:p-8">
				<Outlet />
			</main>
		</div>
	),
})