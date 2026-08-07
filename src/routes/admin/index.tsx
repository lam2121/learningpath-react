import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Settings, LayoutDashboard, DollarSign, AlertTriangle, Zap, Shield, Plus, Loader2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/shadcn/lib/util';
import { Card, CardContent } from '@/shadcn/component/ui/card';
import { Badge } from '@/shadcn/component/ui/badge';
import { fetchDashboard, fetchKillSwitchState, type DashboardData } from '@/feature/admin/api/adminApi';

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
	const [data, setData] = useState<DashboardData | null>(null);
	const [killSwitchOn, setKillSwitchOn] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const [dash, ks] = await Promise.all([
					fetchDashboard(),
					fetchKillSwitchState(),
				]);
				setData(dash);
				setKillSwitchOn(ks.enabled);
			} catch (error) {
				console.error('Failed to load dashboard:', error);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
			</div>
		)
	}

	const inactive = data ? data.totalTracks - data.activeTracks : 0;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
					<p className="text-gray-500">Manage TMA IT Communication System</p>
				</div>
				<Badge variant={killSwitchOn ? 'destructive' : 'outline'} className="gap-1.5 px-3 py-1">
					<Zap className="h-3 w-3" />
					AI Generation: {killSwitchOn ? 'DISABLED' : 'ACTIVE'}
				</Badge>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<StatCard title="Total Tracks" value={String(data?.totalTracks ?? 0)} subtitle={`${data?.activeTracks ?? 0} active, ${inactive} inactive`} icon={Settings} color="blue" />
				<StatCard title="Active Learners" value={(data?.activeLearners ?? 0).toLocaleString()} subtitle="Across all tracks" icon={LayoutDashboard} color="green" />
				<StatCard title="AI Calls (30d)" value={(data?.aiCalls30d ?? 0).toLocaleString()} subtitle={`$${(data?.aiCost30d ?? 0).toFixed(2)} total cost`} icon={DollarSign} color="orange" />
				<StatCard title="Rejected Items" value={String(data?.pendingRejected ?? 0)} subtitle="pending review" icon={AlertTriangle} color="red" />
			</div>

			{/* Kill Switch Status */}
			<Card>
				<CardContent className="p-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', killSwitchOn ? 'bg-red-100' : 'bg-green-100')}>
								<Shield className={cn('h-6 w-6', killSwitchOn ? 'text-red-600' : 'text-green-600')} />
							</div>
							<div>
								<h3 className="font-semibold text-gray-900">Emergency Kill Switch</h3>
								<p className="text-sm text-gray-500">
									{killSwitchOn ? 'AI Generation is DISABLED - serving cache only' : 'AI Generation operating normally'}
								</p>
							</div>
						</div>
						<Badge variant={killSwitchOn ? 'destructive' : 'default'} className="text-base px-3 py-1">
							STATUS: {killSwitchOn ? 'DISABLED' : 'ENABLED'}
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
							<p className="text-sm text-gray-500">Add new career track with D/C/T/G budget</p>
						</Link>
						<Link to="/admin/costs" className="p-4 rounded-lg border hover:bg-gray-50 transition-colors">
							<DollarSign className="h-8 w-8 text-green-600 mb-2" />
							<h4 className="font-medium text-gray-900">View Cost Dashboard</h4>
							<p className="text-sm text-gray-500">Track AI costs by generator</p>
						</Link>
						<Link to="/admin/rejected" className="p-4 rounded-lg border hover:bg-gray-50 transition-colors">
							<AlertTriangle className="h-8 w-8 text-red-600 mb-2" />
							<h4 className="font-medium text-gray-900">Review Rejected Content</h4>
							<p className="text-sm text-gray-500">View and process content rejected by validator</p>
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
