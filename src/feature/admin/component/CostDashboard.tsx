import { useEffect, useMemo, useRef, useState } from 'react';
import {
	Area,
	AreaChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Tooltip as RechartsTooltip,
	BarChart,
	Bar,
	ReferenceDot,
	XAxis,
	YAxis,
} from 'recharts';
import {
	Activity,
	AlertTriangle,
	ArrowRight,
	DollarSign,
	Loader2,
	Shield,
	TrendingUp,
	Zap,
} from 'lucide-react';
import { cn } from '@/shadcn/lib/util';
import { Alert, AlertDescription } from '@/shadcn/component/ui/alert';
import { Badge } from '@/shadcn/component/ui/badge';
import { Button } from '@/shadcn/component/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn/component/ui/card';
import { Progress } from '@/shadcn/component/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shadcn/component/ui/tabs';
import { KillSwitchToggle } from './KillSwitchToggle';
import { fetchCostDashboard, fetchKillSwitchState, toggleKillSwitch, type CostDashboardData, type KillSwitchState } from '../api/adminApi';

type DashboardTab = 'overview' | 'generator' | 'alerts';

function generatorLabel(code: string): string {
	switch (code) {
		case 'A':
			return 'Placement Test';
		case 'B1':
			return 'Topic Outline';
		case 'B2':
			return 'Lesson Outline';
		case 'C1':
			return 'Theory';
		case 'C2':
			return 'Quiz';
		case 'D1':
			return 'Evaluator';
		case 'D2':
			return 'Advisor';
		default:
			return code;
	}
}

function formatCurrency(value: number): string {
	return `$${value.toFixed(2)}`;
}

function formatDateLabel(value: string | undefined | null): string {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '—';
	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
	}).format(date);
}

function CostTooltip({
	active,
	payload,
	label,
}: {
	active?: boolean;
	payload?: Array<{ value: number; payload: { byGenerator: Record<string, number> } }>;
	label?: string;
}) {
	if (!active || !payload?.length || !label) return null;

	const day = payload[0]?.payload;
	const breakdown = Object.entries(day?.byGenerator ?? {}).sort(([, a], [, b]) => b - a);

	return (
		<div className="min-w-52 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
			<p className="text-sm font-semibold text-slate-900">{formatDateLabel(label)}</p>
			<p className="mt-1 text-2xl font-bold text-slate-950">{formatCurrency(Number(payload[0].value ?? 0))}</p>
			{breakdown.length > 0 ? (
				<div className="mt-3 space-y-1.5">
					{breakdown.map(([generator, cost]) => (
						<div key={generator} className="flex items-center justify-between gap-4 text-xs text-slate-600">
							<span>{generatorLabel(generator)}</span>
							<span className="font-medium text-slate-900">{formatCurrency(cost)}</span>
						</div>
					))}
				</div>
			) : (
				<p className="mt-3 text-xs text-slate-500">No generator activity.</p>
			)}
		</div>
	);
}

function EmptyState({ title, description }: { title: string; description: string }) {
	return (
		<div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
			<Activity className="h-10 w-10 text-slate-300" />
			<div>
				<p className="font-semibold text-slate-900">{title}</p>
				<p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
			</div>
		</div>
	);
}

export function CostDashboard() {
	const [data, setData] = useState<CostDashboardData | null>(null);
	const [loading, setLoading] = useState(true);
	const [killSwitch, setKillSwitch] = useState<KillSwitchState>({ enabled: false });
	const [toggling, setToggling] = useState(false);
	const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
	const alertsRef = useRef<HTMLDivElement | null>(null);
	const days = 30;

	useEffect(() => {
		loadData();
		loadKillSwitch();

		const handleKillSwitchChange = (e: CustomEvent) => {
			setKillSwitch(e.detail);
		};
		window.addEventListener('kill-switch-changed', handleKillSwitchChange as EventListener);
		return () => window.removeEventListener('kill-switch-changed', handleKillSwitchChange as EventListener);
	}, []);

	const loadData = async () => {
		setLoading(true);
		try {
			const result = await fetchCostDashboard();
			setData(result);
		} catch (error) {
			console.error('Failed to load cost dashboard:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadKillSwitch = async () => {
		try {
			const state = await fetchKillSwitchState();
			setKillSwitch(state);
		} catch (error) {
			console.error('Failed to load kill switch:', error);
		}
	};

	const handleToggleKillSwitch = async (enabled: boolean) => {
		setToggling(true);
		try {
			const result = await toggleKillSwitch(enabled, 'Manual toggle by admin');
			setKillSwitch(result);
		} catch (error) {
			console.error('Failed to toggle kill switch:', error);
		} finally {
			setToggling(false);
		}
	};

	const metrics = useMemo(() => {
		if (!data) return null;
		const recent7Days = data.dailyCosts.slice(-7);
		const avg7d = recent7Days.length > 0
			? recent7Days.reduce((sum, day) => sum + day.total, 0) / recent7Days.length
			: 0;
		const yesterday = data.dailyCosts[data.dailyCosts.length - 1];
		const yesterdayCost = yesterday?.total ?? 0;
		const spikePercent = avg7d > 0 ? ((yesterdayCost / avg7d) - 1) * 100 : 0;
		const isSpike = spikePercent > 50;
		const highestGenerator = [...data.generatorBreakdown].sort((a, b) => b.totalCost - a.totalCost)[0] ?? null;
		const chartData = data.dailyCosts.map(day => ({
			...day,
			label: formatDateLabel(day.date),
			isSpike: day.total > avg7d * 1.5 && day.total > 0,
		}));
		return {
			avg7d,
			yesterday,
			yesterdayCost,
			spikePercent,
			isSpike,
			highestGenerator,
			chartData,
			recentLogs: data.dailyCosts.slice(-10).reverse(),
		};
	}, [data]);

	const openAlerts = () => {
		setActiveTab('alerts');
		window.requestAnimationFrame(() => {
			alertsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	};

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
			</div>
		);
	}

	if (!data || !metrics) {
		return <div className="py-12 text-center text-gray-500">Cannot load cost data</div>;
	}

	return (
		<div className="space-y-6">
			{metrics.isSpike && (
				<Alert className="border-red-200 bg-red-50">
					<AlertTriangle className="h-4 w-4 text-red-600" />
					<AlertDescription className="flex flex-col gap-3 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<strong>Cost Alert:</strong> Yesterday's cost {formatCurrency(metrics.yesterdayCost)} exceeded {metrics.spikePercent.toFixed(0)}% of the 7-day average ({formatCurrency(metrics.avg7d)}).
						</div>
						{data.alerts.length > 0 && (
							<Button variant="outline" size="sm" className="border-red-200 bg-white text-red-700 hover:bg-red-100" onClick={openAlerts}>
								Open Alerts
								<ArrowRight className="ml-2 h-3.5 w-3.5" />
							</Button>
						)}
					</AlertDescription>
				</Alert>
			)}

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_360px]">
				<Card className="border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
					<CardHeader className="pb-3">
						<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
							<div>
								<CardTitle className="text-xl text-slate-950">AI Spend Trend</CardTitle>
								<CardDescription>Thirty-day cost pattern across all generators.</CardDescription>
							</div>
							<div className="flex flex-wrap gap-2">
								<Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
									{days} days
								</Badge>
								<Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
									{data.generatorBreakdown.length} active generators
								</Badge>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-5">
						<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
							<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">30-day spend</p>
								<p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{formatCurrency(data.totalCost30d)}</p>
							</div>
							<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Yesterday</p>
								<p className={cn('mt-2 text-3xl font-bold tracking-tight', metrics.isSpike ? 'text-red-600' : 'text-slate-950')}>
									{formatCurrency(metrics.yesterdayCost)}
								</p>
							</div>
							<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">7-day average</p>
								<p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{formatCurrency(metrics.avg7d)}</p>
							</div>
							<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Delta vs avg</p>
								<p className={cn('mt-2 text-3xl font-bold tracking-tight', metrics.spikePercent > 0 ? 'text-red-600' : 'text-emerald-600')}>
									{metrics.avg7d > 0 ? `${metrics.spikePercent > 0 ? '+' : ''}${metrics.spikePercent.toFixed(0)}%` : '0%'}
								</p>
							</div>
						</div>

						{metrics.chartData.every(day => day.total === 0) ? (
							<EmptyState
								title="No AI spend recorded yet"
								description="The dashboard will populate once placement, course, or lesson generation runs start logging cost activity."
							/>
						) : (
							<div className="h-[320px] rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4">
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart data={metrics.chartData} margin={{ top: 16, right: 16, left: 0, bottom: 4 }}>
										<defs>
											<linearGradient id="costAreaFill" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.28} />
												<stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.04} />
											</linearGradient>
										</defs>
										<CartesianGrid vertical={false} stroke="rgba(148,163,184,0.16)" />
										<XAxis
											dataKey="label"
											tickLine={false}
											axisLine={false}
											minTickGap={20}
											tick={{ fill: '#64748b', fontSize: 12 }}
										/>
										<YAxis
											tickLine={false}
											axisLine={false}
											width={72}
											tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
											tick={{ fill: '#64748b', fontSize: 12 }}
										/>
										<RechartsTooltip content={<CostTooltip />} />
										<Area
											type="monotone"
											dataKey="total"
											stroke="var(--color-chart-1)"
											strokeWidth={2.5}
											fill="url(#costAreaFill)"
										/>
										{metrics.chartData
											.filter(day => day.isSpike)
											.map(day => (
												<ReferenceDot
													key={day.date}
													x={day.label}
													y={day.total}
													r={4}
													fill="var(--destructive)"
													stroke="white"
													strokeWidth={2}
												/>
											))}
									</AreaChart>
								</ResponsiveContainer>
							</div>
						)}
					</CardContent>
				</Card>

				<div className="space-y-4">
					<Card className="border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-slate-950">
								<Shield className="h-5 w-5 text-red-600" />
								Operations
							</CardTitle>
							<CardDescription>Emergency control for AI generation availability.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<KillSwitchToggle
								compact
								enabled={killSwitch.enabled}
								onToggle={handleToggleKillSwitch}
								disabled={toggling}
							/>
							<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Current state</p>
										<p className={cn('mt-2 text-lg font-semibold', killSwitch.enabled ? 'text-red-700' : 'text-emerald-700')}>
											{killSwitch.enabled ? 'Emergency Off' : 'AI Active'}
										</p>
									</div>
									<Badge variant={killSwitch.enabled ? 'destructive' : 'outline'} className={cn(!killSwitch.enabled && 'border-emerald-200 bg-emerald-50 text-emerald-700')}>
										{killSwitch.enabled ? 'Disabled' : 'Enabled'}
									</Badge>
								</div>
								{killSwitch.enabledAt && (
									<p className="mt-3 text-xs text-slate-500">
										Changed {new Date(killSwitch.enabledAt).toLocaleString()}
									</p>
								)}
								{killSwitch.reason && (
									<p className="mt-2 text-sm text-slate-600">
										Reason: {killSwitch.reason}
									</p>
								)}
							</div>
						</CardContent>
					</Card>

					<Card className="border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-slate-950">
								<AlertTriangle className="h-5 w-5 text-amber-600" />
								Alert Posture
							</CardTitle>
							<CardDescription>Latest risk signals from the cost monitor.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-3">
								<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
									<p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Open alerts</p>
									<p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{data.alerts.length}</p>
								</div>
								<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
									<p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Top driver</p>
									<p className="mt-2 text-base font-semibold text-slate-950">
										{metrics.highestGenerator ? metrics.highestGenerator.generator : 'N/A'}
									</p>
									<p className="mt-1 text-xs text-slate-500">
										{metrics.highestGenerator ? generatorLabel(metrics.highestGenerator.generator) : 'No generator activity'}
									</p>
								</div>
							</div>
							<Alert className={cn('border', metrics.isSpike ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50')}>
								{metrics.isSpike ? <TrendingUp className="h-4 w-4 text-amber-600" /> : <Zap className="h-4 w-4 text-emerald-600" />}
								<AlertDescription className="text-sm">
									{metrics.isSpike
										? `Yesterday is trending above normal cost activity by ${metrics.spikePercent.toFixed(0)}%.`
										: 'No abnormal spend spike detected in the current 7-day window.'}
								</AlertDescription>
							</Alert>
							{data.alerts.length > 0 && (
								<Button variant="outline" className="w-full justify-between" onClick={openAlerts}>
									Review alerts
									<ArrowRight className="h-4 w-4" />
								</Button>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-gray-500">30-Day Spend</CardTitle>
						<DollarSign className="h-4 w-4 text-gray-400" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-gray-900">{formatCurrency(data.totalCost30d)}</div>
						<p className="text-xs text-gray-500">Daily average {formatCurrency(data.dailyAverage)}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-gray-500">Yesterday</CardTitle>
						<TrendingUp className="h-4 w-4 text-gray-400" />
					</CardHeader>
					<CardContent>
						<div className={cn('text-3xl font-bold', metrics.isSpike ? 'text-red-600' : 'text-green-600')}>
							{formatCurrency(metrics.yesterdayCost)}
						</div>
						<p className="text-xs text-gray-500">Compared to {formatCurrency(metrics.avg7d)} avg</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-gray-500">Active Generators</CardTitle>
						<Activity className="h-4 w-4 text-gray-400" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-gray-900">{data.generatorBreakdown.length}</div>
						<p className="text-xs text-gray-500">Prompt types with spend this month</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-gray-500">Top Cost Driver</CardTitle>
						<Zap className="h-4 w-4 text-gray-400" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-gray-900">
							{metrics.highestGenerator ? metrics.highestGenerator.generator : 'N/A'}
						</div>
						<p className="text-xs text-gray-500">
							{metrics.highestGenerator
								? `${generatorLabel(metrics.highestGenerator.generator)} · ${formatCurrency(metrics.highestGenerator.totalCost)}`
								: 'No generator activity recorded'}
						</p>
					</CardContent>
				</Card>
			</div>

			<Tabs value={activeTab} onValueChange={value => setActiveTab(value as DashboardTab)} className="space-y-6">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="generator">Generators</TabsTrigger>
					<TabsTrigger value="alerts">Alerts</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg text-slate-950">Daily Spend Log</CardTitle>
							<CardDescription>Most recent 10 days of activity, including per-generator contributions.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{metrics.recentLogs.map((day, idx) => {
								const isYesterday = idx === 0;
								const isSpikeDay = day.total > metrics.avg7d * 1.5 && day.total > 0;
								return (
									<div
										key={day.date}
										className={cn(
											'rounded-xl border p-4',
											isYesterday ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white',
											isSpikeDay && !isYesterday ? 'border-amber-200 bg-amber-50' : '',
										)}
									>
										<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
											<div className="min-w-[180px]">
												<p className="font-medium text-slate-900">{day.date ? new Date(day.date).toLocaleDateString() : '—'}</p>
												<p className="text-xs text-slate-500">
													{isYesterday ? 'Yesterday' : isSpikeDay ? 'Above threshold' : 'Normal'}
												</p>
											</div>
											<div className="flex-1">
												<div className="mb-1 flex items-center gap-2">
													<Progress value={(day.total / (Math.max(data.dailyAverage, 0.01) * 3)) * 100} className="h-2 flex-1 max-w-md" />
													<span className="w-20 text-right text-sm font-bold tabular-nums">{formatCurrency(day.total)}</span>
												</div>
											</div>
											<div className="flex flex-wrap gap-1">
												{Object.entries(day.byGenerator).length > 0 ? (
													Object.entries(day.byGenerator).map(([gen, cost]) => (
														<Badge key={gen} variant="outline" className="h-auto px-2 py-0.5 text-xs">
															{gen}: {formatCurrency(cost)}
														</Badge>
													))
												) : (
													<Badge variant="outline" className="h-auto px-2 py-0.5 text-xs text-slate-500">
														No generator activity
													</Badge>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="generator" className="space-y-4">
					<div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg text-slate-950">Spend Share</CardTitle>
								<CardDescription>Percentage of total spend by generator.</CardDescription>
							</CardHeader>
							<CardContent>
								{data.generatorBreakdown.length === 0 ? (
									<EmptyState
										title="No generator activity"
										description="Generator share appears here once AI usage logs are recorded."
									/>
								) : (
									<div className="h-[280px]">
										<ResponsiveContainer width="100%" height="100%">
											<BarChart
												layout="vertical"
												data={data.generatorBreakdown.map(item => ({
													...item,
													share: data.totalCost30d > 0 ? (item.totalCost / data.totalCost30d) * 100 : 0,
												}))}
												margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
											>
												<CartesianGrid horizontal={false} stroke="rgba(148,163,184,0.16)" />
												<XAxis type="number" hide />
												<YAxis type="category" dataKey="generator" axisLine={false} tickLine={false} width={48} />
												<RechartsTooltip
													formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Spend share']}
													labelFormatter={(label) => generatorLabel(String(label))}
												/>
												<Bar dataKey="share" radius={[999, 999, 999, 999]}>
													{data.generatorBreakdown.map((item, index) => (
														<Cell key={item.generator} fill={`var(--color-chart-${(index % 5) + 1})`} />
													))}
												</Bar>
											</BarChart>
										</ResponsiveContainer>
									</div>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-lg text-slate-950">Generator Breakdown</CardTitle>
								<CardDescription>Call volume, tokens, and cost efficiency by generator type.</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b border-gray-100 text-left text-gray-500">
												<th className="pb-2">Generator</th>
												<th className="pb-2 text-right">Call Count</th>
												<th className="pb-2 text-right">Total Tokens</th>
												<th className="pb-2 text-right">Total Cost</th>
												<th className="pb-2 text-right">Avg Cost</th>
												<th className="pb-2 text-right">% of Total</th>
											</tr>
										</thead>
										<tbody>
											{data.generatorBreakdown.map((gen) => (
												<tr key={gen.generator} className="border-b border-gray-50">
													<td className="py-3 font-medium">
														<div className="flex items-center gap-2">
															<Badge variant="outline" className="px-2 py-0.5 text-xs">{gen.generator}</Badge>
															<span className="text-gray-500">{generatorLabel(gen.generator)}</span>
														</div>
													</td>
													<td className="py-3 text-right tabular-nums">{gen.count.toLocaleString()}</td>
													<td className="py-3 text-right tabular-nums">{gen.totalTokens.toLocaleString()}</td>
													<td className="py-3 text-right font-medium tabular-nums">{formatCurrency(gen.totalCost)}</td>
													<td className="py-3 text-right tabular-nums">${gen.avgCost.toFixed(4)}</td>
													<td className="py-3 text-right tabular-nums">
														{(data.totalCost30d > 0 ? (gen.totalCost / data.totalCost30d) * 100 : 0).toFixed(1)}%
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="alerts" className="space-y-4">
					<div ref={alertsRef} />
					{data.alerts.length === 0 ? (
						<EmptyState
							title="No alerts"
							description="The cost monitor has not detected any spike, budget, or kill-switch alerts in the current window."
						/>
					) : (
						<div className="space-y-3">
							{data.alerts.map((alert, idx) => (
								<Alert
									key={`${alert.date}-${idx}`}
									className={cn(
										'border',
										alert.type === 'spike'
											? 'border-red-200 bg-red-50'
											: alert.type === 'kill_switch'
												? 'border-amber-200 bg-amber-50'
												: 'border-slate-200 bg-slate-50'
									)}
								>
									<AlertTriangle className={cn('h-4 w-4', alert.type === 'spike' ? 'text-red-600' : 'text-amber-600')} />
									<AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
										<div>
											<div className="flex items-center gap-2">
												<Badge variant="outline" className="bg-white">
													{alert.type.replace('_', ' ')}
												</Badge>
												<span className="text-xs text-slate-500">{alert.date ? new Date(alert.date).toLocaleDateString() : '—'}</span>
											</div>
											<p className="mt-2 text-sm text-slate-800">{alert.message}</p>
										</div>
									</AlertDescription>
								</Alert>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
