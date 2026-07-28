import { createFileRoute } from '@tanstack/react-router';
import { Settings, LayoutDashboard, DollarSign, AlertTriangle, Zap, Shield, Plus } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/shadcn/lib/util';
import { Card, CardContent } from '@/shadcn/component/ui/card';
import { Badge } from '@/shadcn/component/ui/badge';

function StatCard({ title, value, subtitle, icon: Icon, color }: { 
	title: string; 
	value: string; 
	subtitle: string; 
	icon: React.ComponentType<{ className?: string }>; 
	color: 'blue' | 'green' | 'orange' | 'red' 
}) {
	const colors = {
		blue: 'bg-blue-100 text-blue-600',
		green: 'bg-green-100 text-green-600',
		orange: 'bg-orange-100 text-orange-600',
		red: 'bg-red-100 text-red-600'
	}
	
	return (
		<Card>
			<CardContent className="p-6">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm text-gray-500">{title}</p>
						<p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
						<p className="text-xs text-gray-500 mt-1">{subtitle}</p>
					</div>
					<div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colors[color])}>
						<Icon className="h-6 w-6" />
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

function DashboardPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
					<p className="text-gray-500">Quản trị hệ thống TMA IT Communication</p>
				</div>
				<Badge variant="outline" className="gap-1.5 px-3 py-1">
					<Zap className="h-3 w-3" />
					AI Generation: ACTIVE
				</Badge>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<StatCard title="Total Tracks" value="5" subtitle="4 active, 1 inactive" icon={Settings} color="blue" />
				<StatCard title="Active Learners" value="904" subtitle="Across all tracks" icon={LayoutDashboard} color="green" />
				<StatCard title="AI Calls (30d)" value="2,847" subtitle="$234.56 total cost" icon={DollarSign} color="orange" />
				<StatCard title="Rejected Items" value="3" subtitle="2 pending review" icon={AlertTriangle} color="red" />
			</div>

			{/* Kill Switch Status */}
			<Card>
				<CardContent className="p-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
								<Shield className="h-6 w-6 text-green-600" />
							</div>
							<div>
								<h3 className="font-semibold text-gray-900">Emergency Kill Switch</h3>
								<p className="text-sm text-gray-500">AI Generation đang hoạt động bình thường</p>
							</div>
						</div>
						<Badge variant="default" className="text-base px-3 py-1 bg-green-100 text-green-700">
							STATUS: ENABLED
						</Badge>
					</div>
				</CardContent>
			</Card>

			{/* Quick Actions */}
			<Card>
				<CardContent className="p-6">
					<h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Link to="/admin/tracks" className="p-4 rounded-lg border hover:bg-gray-50 transition-colors">
							<Plus className="h-8 w-8 text-blue-600 mb-2" />
							<h4 className="font-medium text-gray-900">Create New Track</h4>
							<p className="text-sm text-gray-500">Thêm career track mới với budget D/C/T/G</p>
						</Link>
						<Link to="/admin/costs" className="p-4 rounded-lg border hover:bg-gray-50 transition-colors">
							<DollarSign className="h-8 w-8 text-green-600 mb-2" />
							<h4 className="font-medium text-gray-900">View Cost Dashboard</h4>
							<p className="text-sm text-gray-500">Theo dõi chi phí AI theo generator</p>
						</Link>
						<Link to="/admin/rejected" className="p-4 rounded-lg border hover:bg-gray-50 transition-colors">
							<AlertTriangle className="h-8 w-8 text-red-600 mb-2" />
							<h4 className="font-medium text-gray-900">Review Rejected Content</h4>
							<p className="text-sm text-gray-500">Xem và xử lý nội dung bị validator từ chối</p>
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

export const Route = createFileRoute('/admin/')({
	component: DashboardPage,
});