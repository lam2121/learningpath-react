import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
	Settings,
	LayoutDashboard,
	DollarSign,
	AlertTriangle,
	Zap,
	Shield,
	Plus,
	ScrollText,
	Loader2,
	Wrench,
	Sparkles,
	CheckCircle2,
	RefreshCw,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/shadcn/lib/util';
import { Card, CardContent } from '@/shadcn/component/ui/card';
import { Badge } from '@/shadcn/component/ui/badge';
import { Button } from '@/shadcn/component/ui/button';
import {
	fetchDashboard,
	fetchKillSwitchState,
	fetchFailedLessons,
	type DashboardData,
	type FailedLesson,
} from '@/feature/admin/api/adminApi';
import { LessonFixModal } from '@/feature/admin/component';

function StatCard({ title, value, subtitle, icon: Icon, color }: { 
	title: string; 
	value: string; 
	subtitle: string; 
	icon: React.ComponentType<{ className?: string }>; 
	color: 'blue' | 'green' | 'orange' | 'red' 
}) {
	const colors = {
		blue: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
		green: 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400',
		orange: 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400',
		red: 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'
	};
	
	return (
		<Card>
			<CardContent className="p-6">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
						<p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
						<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
					</div>
					<div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colors[color])}>
						<Icon className="h-6 w-6" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function DashboardPage() {
	const [data, setData] = useState<DashboardData | null>(null);
	const [killSwitchOn, setKillSwitchOn] = useState(false);
	const [failedLessons, setFailedLessons] = useState<FailedLesson[]>([]);
	const [fixingLesson, setFixingLesson] = useState<FailedLesson | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const loadData = async (isInitial = false) => {
		if (isInitial) setLoading(true);
		else setRefreshing(true);
		try {
			const [dash, ks, failed] = await Promise.all([
				fetchDashboard(),
				fetchKillSwitchState(),
				fetchFailedLessons(),
			]);
			setData(dash);
			setKillSwitchOn(ks.enabled);
			setFailedLessons(failed);
		} catch (error) {
			console.error('Failed to load dashboard:', error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		void loadData(true);
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
			</div>
		);
	}

	const inactive = data ? data.totalTracks - data.activeTracks : 0;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
					<p className="text-gray-500 dark:text-gray-400">Manage AI Learning Path System</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => loadData(false)}
						disabled={refreshing}
						className="h-8 gap-1.5 text-xs text-slate-700 dark:text-slate-300"
					>
						<RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
						Refresh
					</Button>
					<Badge variant={killSwitchOn ? 'destructive' : 'outline'} className="gap-1.5 px-3 py-1">
						<Zap className="h-3 w-3" />
						AI Generation: {killSwitchOn ? 'DISABLED' : 'ACTIVE'}
					</Badge>
				</div>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
				<StatCard title="Total Tracks" value={String(data?.totalTracks ?? 0)} subtitle={`${data?.activeTracks ?? 0} active, ${inactive} inactive`} icon={Settings} color="blue" />
				<StatCard title="Active Learners" value={(data?.activeLearners ?? 0).toLocaleString()} subtitle="Across all tracks" icon={LayoutDashboard} color="green" />
				<StatCard title="AI Calls (30d)" value={(data?.aiCalls30d ?? 0).toLocaleString()} subtitle={`$${(data?.aiCost30d ?? 0).toFixed(2)} total cost`} icon={DollarSign} color="orange" />
				<StatCard title="Rejected Items" value={String(data?.pendingRejected ?? 0)} subtitle="pending review" icon={AlertTriangle} color="red" />
				<StatCard
					title="Failed Lessons"
					value={String(failedLessons.length)}
					subtitle={failedLessons.length > 0 ? `${failedLessons.length} need fixing` : 'All lessons healthy'}
					icon={Wrench}
					color={failedLessons.length > 0 ? 'red' : 'green'}
				/>
			</div>

			{/* Failed Lessons Action Section */}
			{failedLessons.length > 0 ? (
				<Card className="border-amber-300 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm">
					<CardContent className="p-6">
						<div className="flex flex-wrap items-center justify-between gap-3 mb-4">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
									<AlertTriangle className="h-5 w-5" />
								</div>
								<div>
									<div className="flex items-center gap-2">
										<h3 className="font-bold text-gray-900 dark:text-gray-100">
											Failed Lesson Generations
										</h3>
										<Badge className="bg-rose-600 text-white text-xs">
											{failedLessons.length} Pending Fix
										</Badge>
									</div>
									<p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
										Click <strong>Fix</strong> to retry generation. If Theory succeeded, you can continue from the checkpoint to use ~70% fewer tokens.
									</p>
								</div>
							</div>

							<Button
								size="sm"
								className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 font-medium shadow-sm"
								onClick={() => setFixingLesson(failedLessons[0])}
							>
								<Wrench className="h-4 w-4" />
								Fix Next ({failedLessons[0].title.slice(0, 20)}...)
							</Button>
						</div>

						<div className="divide-y divide-gray-200 dark:divide-gray-800 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
							{failedLessons.map((lesson) => {
								const hasTheory = lesson.hasPartialTheory || lesson.failedStep === 'C2';
								return (
									<div
										key={lesson.id}
										className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
									>
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<span className="font-mono text-xs font-semibold text-gray-500 dark:text-gray-400">
													#{lesson.id}
												</span>
												<h4 className="font-semibold text-gray-900 dark:text-gray-100">
													{lesson.title}
												</h4>
												{hasTheory ? (
													<Badge className="bg-emerald-600 text-white text-[10px] gap-1">
														<Sparkles className="h-2.5 w-2.5" />
														Theory Checkpointed (Saves ~70% Tokens)
													</Badge>
												) : (
													<Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-400 text-[10px]">
														Failed at {lesson.failedStep || 'C1'}
													</Badge>
												)}
											</div>
											<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
												{[lesson.roleName, lesson.topicName].filter(Boolean).join(' • ')}
												{lesson.errorMessage && (
													<span className="text-rose-600 dark:text-rose-400 ml-1">
														({lesson.errorMessage})
													</span>
												)}
											</p>
										</div>

										<Button
											size="sm"
											className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white gap-1.5 font-medium"
											onClick={() => setFixingLesson(lesson)}
										>
											<Wrench className="h-3.5 w-3.5" />
											Fix Lesson
										</Button>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="flex items-center justify-between rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/20 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
					<div className="flex items-center gap-2.5">
						<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
						<span>All lesson generations are healthy. No failed lessons detected.</span>
					</div>
					<Button
						variant="ghost"
						size="sm"
						className="h-7 text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-900"
						onClick={() => loadData(false)}
						disabled={refreshing}
					>
						<RefreshCw className={cn('mr-1 h-3 w-3', refreshing && 'animate-spin')} />
						Check Status
					</Button>
				</div>
			)}

			{/* Kill Switch Status */}
			<Card>
				<CardContent className="p-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', killSwitchOn ? 'bg-red-100 dark:bg-red-950' : 'bg-green-100 dark:bg-green-950')}>
								<Shield className={cn('h-6 w-6', killSwitchOn ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400')} />
							</div>
							<div>
								<h3 className="font-semibold text-gray-900 dark:text-gray-100">Emergency Kill Switch</h3>
								<p className="text-sm text-gray-500 dark:text-gray-400">
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
					<h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<Link to="/admin/tracks" className="p-4 rounded-lg border dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
							<Plus className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
							<h4 className="font-medium text-gray-900 dark:text-gray-100">Create New Track</h4>
							<p className="text-sm text-gray-500 dark:text-gray-400">Add new career track with D/C/T/G budget</p>
						</Link>
						<Link to="/admin/costs" className="p-4 rounded-lg border dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
							<DollarSign className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
							<h4 className="font-medium text-gray-900 dark:text-gray-100">View Cost Dashboard</h4>
							<p className="text-sm text-gray-500 dark:text-gray-400">Track AI costs by generator</p>
						</Link>
						<Link to="/admin/usage-logs" className="p-4 rounded-lg border dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
							<ScrollText className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mb-2" />
							<h4 className="font-medium text-gray-900 dark:text-gray-100">Inspect AI Usage Logs</h4>
							<p className="text-sm text-gray-500 dark:text-gray-400">Review call history and clear old records</p>
						</Link>
						<Link to="/admin/rejected" className="p-4 rounded-lg border dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
							<AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400 mb-2" />
							<h4 className="font-medium text-gray-900 dark:text-gray-100">Review Rejected Content</h4>
							<p className="text-sm text-gray-500 dark:text-gray-400">View and process content rejected by validator</p>
						</Link>
					</div>
				</CardContent>
			</Card>

			<LessonFixModal
				isOpen={Boolean(fixingLesson)}
				onClose={() => setFixingLesson(null)}
				lesson={fixingLesson}
				onSuccess={() => loadData(false)}
			/>
		</div>
	);
}

export const Route = createFileRoute('/_protected/admin/')({
	component: DashboardPage,
});

