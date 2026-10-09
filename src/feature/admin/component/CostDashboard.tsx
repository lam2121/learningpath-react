import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip as RechartsTooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { Activity, AlertTriangle, DollarSign, Hash, Info, Loader2, Shield, Zap } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/shadcn/component/ui/alert';
import { Badge } from '@/shadcn/component/ui/badge';
import { Button } from '@/shadcn/component/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn/component/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shadcn/component/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shadcn/component/ui/tabs';
import { cn } from '@/shadcn/lib/util';

import { KillSwitchToggle } from './KillSwitchToggle';
import { CostBreakdownPanel } from './CostBreakdownPanel';
import {
	fetchCostDashboard,
	fetchKillSwitchState,
	fetchTracks,
	toggleKillSwitch,
	type CareerTrack,
	type CostDashboardData,
	type CostGranularity,
	type CostRange,
	type KillSwitchState,
} from '../api/adminApi';
import {
	formatCost,
	formatCostShort,
	formatTokens,
	generatorLabel,
	generatorOptionLabel,
} from '../lib/labels';

const RANGE_OPTIONS: Array<{ value: CostRange; label: string }> = [
	{ value: '7d', label: 'Last 7 days' },
	{ value: '30d', label: 'Last 30 days' },
	{ value: '90d', label: 'Last 90 days' },
	{ value: 'this_month', label: 'This month' },
	{ value: 'last_month', label: 'Last month' },
	{ value: '12m', label: 'Last 12 months' },
	{ value: 'all', label: 'All time' },
];

const GRANULARITIES: CostGranularity[] = ['daily', 'weekly', 'monthly'];
const GENERATORS = ['A', 'B1', 'B2', 'C1', 'C2'];
const STATUSES = ['success', 'retry', 'rejected', 'fallback'];

const BUCKET_NOUN: Record<CostGranularity, string> = {
	daily: 'day',
	weekly: 'week',
	monthly: 'month',
};

interface Filters {
	range: CostRange;
	granularity: CostGranularity | 'auto';
	generator: string;
	model: string;
	roleId: string;
	status: string;
}

const DEFAULT_FILTERS: Filters = {
	range: '30d',
	granularity: 'auto',
	generator: 'all',
	model: 'all',
	roleId: 'all',
	status: 'all',
};

function StatTile({
	label,
	value,
	sub,
	icon: Icon,
	badge,
}: {
	label: string;
	value: string;
	sub?: string;
	icon: typeof DollarSign;
	badge?: string;
}) {
	return (
		<div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
			<div className="flex items-start justify-between gap-2">
				<p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
				<Icon className="h-4 w-4 shrink-0 text-slate-400" />
			</div>
			<div className="mt-2 flex items-baseline gap-2">
				<p className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50 tabular-nums">{value}</p>
				{badge && (
					<Badge variant="outline" className="border-slate-300 dark:border-slate-600 text-[10px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
						{badge}
					</Badge>
				)}
			</div>
			{sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
		</div>
	);
}

function SpendTooltip({
	active,
	payload,
	label,
}: {
	active?: boolean;
	payload?: Array<{ payload: { total: number; calls: number; byGenerator: Record<string, number> } }>;
	label?: string;
}) {
	if (!active || !payload?.length) return null;
	const bucket = payload[0]?.payload;
	if (!bucket) return null;
	const breakdown = Object.entries(bucket.byGenerator ?? {}).sort(([, a], [, b]) => b - a);
	return (
		<div className="min-w-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-lg">
			<p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
			<p className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-50 tabular-nums">{formatCost(bucket.total)}</p>
			<p className="text-xs text-slate-500 dark:text-slate-400">{bucket.calls.toLocaleString()} calls</p>
			{breakdown.length > 0 && (
				<div className="mt-3 space-y-1 border-t border-slate-100 dark:border-slate-700 pt-2">
					{breakdown.map(([gen, cost]) => (
						<div key={gen} className="flex items-center justify-between gap-4 text-xs">
							<span className="text-slate-500 dark:text-slate-400">{gen} · {generatorLabel(gen)}</span>
							<span className="font-medium tabular-nums text-slate-900 dark:text-slate-100">{formatCost(cost)}</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export function CostDashboard() {
	const [data, setData] = useState<CostDashboardData | null>(null);
	const [tracks, setTracks] = useState<CareerTrack[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
	const [killSwitch, setKillSwitch] = useState<KillSwitchState>({ enabled: false });
	const [toggling, setToggling] = useState(false);
	const requestSeq = useRef(0);

	const loadData = useCallback(async (flt: Filters) => {
		setLoading(true);
		const seq = ++requestSeq.current;
		try {
			const result = await fetchCostDashboard({
				range: flt.range,
				granularity: flt.granularity === 'auto' ? undefined : flt.granularity,
				generator: flt.generator,
				model: flt.model,
				roleId: flt.roleId === 'all' ? null : Number(flt.roleId),
				status: flt.status,
			});
			if (seq !== requestSeq.current) return;
			setData(result);
			setError(null);
		} catch (err) {
			if (seq === requestSeq.current) {
				setError(err instanceof Error ? err.message : 'Cannot load cost data.');
			}
		} finally {
			if (seq === requestSeq.current) setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadData(filters);
	}, [filters, loadData]);

	useEffect(() => {
		fetchTracks().then(setTracks).catch(() => setTracks([]));
		fetchKillSwitchState().then(setKillSwitch).catch(err => console.error('Failed to load kill switch:', err));

		const onChange = (e: Event) => setKillSwitch((e as CustomEvent).detail);
		window.addEventListener('kill-switch-changed', onChange);
		return () => window.removeEventListener('kill-switch-changed', onChange);
	}, []);

	const handleToggleKillSwitch = async (enabled: boolean) => {
		setToggling(true);
		try {
			setKillSwitch(await toggleKillSwitch(enabled, 'Manual toggle by admin'));
		} catch (err) {
			console.error('Failed to toggle kill switch:', err);
		} finally {
			setToggling(false);
		}
	};

	const chartData = useMemo(
		() => data?.buckets.map(bucket => ({ ...bucket, name: bucket.label })) ?? [],
		[data]
	);

	const hasActiveFilters =
		filters.generator !== 'all' ||
		filters.model !== 'all' ||
		filters.roleId !== 'all' ||
		filters.status !== 'all';

	const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
		setFilters(prev => ({ ...prev, [key]: value }));

	const topDriver = data?.byGenerator[0] ?? null;
	const bucketNoun = data ? BUCKET_NOUN[data.granularity] : 'day';

	return (
		<div className="space-y-6">
			{/* ── Filters ───────────────────────────────────────────────── */}
			<div className="flex flex-wrap items-center gap-3 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
				<Select value={filters.range} onValueChange={v => set('range', v as CostRange)}>
					<SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
					<SelectContent>
						{RANGE_OPTIONS.map(option => (
							<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
						))}
					</SelectContent>
				</Select>

				<div className="inline-flex rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 p-0.5">
					{GRANULARITIES.map(g => {
						const activeG = filters.granularity === 'auto' ? data?.granularity : filters.granularity;
						return (
							<button
								key={g}
								type="button"
								onClick={() => set('granularity', g)}
								className={cn(
									'rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors',
									activeG === g ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
								)}
							>
								{g}
							</button>
						);
					})}
				</div>

				<Select value={filters.generator} onValueChange={v => set('generator', v)}>
					<SelectTrigger className="w-[185px]"><SelectValue placeholder="Generator" /></SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All generators</SelectItem>
						{GENERATORS.map(g => (
							<SelectItem key={g} value={g}>{generatorOptionLabel(g)}</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={filters.model} onValueChange={v => set('model', v)}>
					<SelectTrigger className="w-[230px]"><SelectValue placeholder="Model" /></SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All models</SelectItem>
						{(data?.availableModels ?? []).map(m => (
							<SelectItem key={m} value={m}>{m}</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={filters.roleId} onValueChange={v => set('roleId', v)}>
					<SelectTrigger className="w-[190px]"><SelectValue placeholder="Career track" /></SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All tracks</SelectItem>
						{tracks.map(track => (
							<SelectItem key={track.id} value={String(track.id)}>{track.name}</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={filters.status} onValueChange={v => set('status', v)}>
					<SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						{STATUSES.map(s => (
							<SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
						))}
					</SelectContent>
				</Select>

				{hasActiveFilters && (
					<Button variant="outline" onClick={() => setFilters(prev => ({ ...DEFAULT_FILTERS, range: prev.range, granularity: prev.granularity }))}>
						Clear filters
					</Button>
				)}

				{loading && <Loader2 className="ml-auto h-4 w-4 animate-spin text-blue-600" />}
			</div>

			{error && (
				<Alert variant="destructive">
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription>
						<p>{error}</p>
					</AlertDescription>
				</Alert>
			)}

			{!data ? (
				<div className="flex items-center justify-center py-24">
					{loading ? <Loader2 className="h-8 w-8 animate-spin text-blue-600" /> : <p className="text-gray-500 dark:text-gray-400">No cost data.</p>}
				</div>
			) : (
				<>
					{/* ── KPIs ──────────────────────────────────────────── */}
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						<StatTile
							label="Total spend"
							value={formatCostShort(data.totalCost)}
							sub={`${data.fromDate} → ${data.toDate}`}
							icon={DollarSign}
							badge="ESTIMATE"
						/>
						<StatTile label="AI calls" value={data.totalCalls.toLocaleString()} sub={`${data.buckets.length} ${bucketNoun}s in range`} icon={Hash} />
						<StatTile label="Tokens" value={formatTokens(data.totalTokens)} sub="prompt + completion" icon={Activity} />
						<StatTile
							label={`Avg per ${bucketNoun}`}
							value={formatCostShort(data.periodAverage)}
							sub={topDriver ? `Top: ${topDriver.key} · ${generatorLabel(topDriver.key)}` : undefined}
							icon={Zap}
						/>
					</div>

					<Alert variant="default" className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
						<Info className="h-4 w-4" />
						<AlertTitle className="text-slate-700 dark:text-slate-300">Estimated costs</AlertTitle>
						<AlertDescription className="text-slate-600 dark:text-slate-400">
							<p>
								Costs are estimated from Gemini rate cards, which bill every non-Gemini-Flash
								model at Gemini Pro rates. Actual generation runs on Mistral, Groq and
								OpenRouter, so comparisons between generators, models and tracks are
								meaningful, but the absolute dollar figures are not real provider billing.
							</p>
						</AlertDescription>
					</Alert>

					{data.alerts.map(alert => (
						<Alert key={alert.date} variant="destructive">
							<AlertTriangle className="h-4 w-4" />
							<AlertDescription>
							<p>{alert.message}</p>
						</AlertDescription>
						</Alert>
					))}

					{/* ── Spend over time ───────────────────────────────── */}
					<Card>
						<CardHeader>
							<CardTitle>Spend over time</CardTitle>
							<CardDescription className="capitalize">{data.granularity} buckets</CardDescription>
						</CardHeader>
						<CardContent>
							{data.totalCost === 0 ? (
								<div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 py-16 text-center">
									<Activity className="h-6 w-6 text-slate-300 dark:text-slate-600" />
									<p className="text-sm text-slate-500 dark:text-slate-400">No spend recorded in this range.</p>
								</div>
							) : (
								<div className="h-[320px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-4">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 4 }}>
											<CartesianGrid vertical={false} stroke="rgba(148,163,184,0.16)" />
											<XAxis dataKey="name" tickLine={false} axisLine={false} minTickGap={16} tick={{ fill: '#64748b', fontSize: 12 }} />
											<YAxis
												tickLine={false}
												axisLine={false}
												width={72}
												tickFormatter={value => formatCostShort(Number(value))}
												tick={{ fill: '#64748b', fontSize: 12 }}
											/>
											<RechartsTooltip content={<SpendTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
											<Bar dataKey="total" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
										</BarChart>
									</ResponsiveContainer>
								</div>
							)}
						</CardContent>
					</Card>

					{/* ── Breakdowns ────────────────────────────────────── */}
					<Card>
						<CardHeader>
							<CardTitle>Breakdown</CardTitle>
							<CardDescription>Where the spend goes, for the current filters</CardDescription>
						</CardHeader>
						<CardContent>
							<Tabs defaultValue="generator">
								<TabsList className="grid w-full grid-cols-5">
									<TabsTrigger value="generator">Generator</TabsTrigger>
									<TabsTrigger value="model">Model</TabsTrigger>
									<TabsTrigger value="provider">Provider</TabsTrigger>
									<TabsTrigger value="track">Career track</TabsTrigger>
									<TabsTrigger value="status">Status</TabsTrigger>
								</TabsList>

								<TabsContent value="generator" className="pt-6">
									<CostBreakdownPanel
										groups={data.byGenerator}
										keyHeader="Generator"
										renderKey={g => `${g.key} · ${generatorLabel(g.key)}`}
									/>
								</TabsContent>
								<TabsContent value="model" className="pt-6">
									<CostBreakdownPanel groups={data.byModel} keyHeader="Model" />
								</TabsContent>
								<TabsContent value="provider" className="pt-6">
									<CostBreakdownPanel groups={data.byProvider} keyHeader="Provider" />
								</TabsContent>
								<TabsContent value="track" className="pt-6">
									<CostBreakdownPanel
										groups={data.byTrack}
										keyHeader="Career track"
										renderKey={g => g.label ?? (g.key === '—' ? 'Unattributed' : `Track ${g.key}`)}
									/>
								</TabsContent>
								<TabsContent value="status" className="pt-6">
									<CostBreakdownPanel groups={data.byStatus} keyHeader="Status" />
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>

					{/* ── Operations ────────────────────────────────────── */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Shield className="h-5 w-5 text-red-600" />
								Operations
							</CardTitle>
							<CardDescription>Stop all AI generation immediately</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<KillSwitchToggle compact enabled={killSwitch.enabled} onToggle={handleToggleKillSwitch} disabled={toggling} />
							{killSwitch.enabled && (
								<div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-800 dark:text-red-200">
									<p className="font-medium">Emergency off</p>
									{killSwitch.enabledAt && <p className="text-xs">Since {new Date(killSwitch.enabledAt).toLocaleString()}</p>}
									{killSwitch.reason && <p className="text-xs">Reason: {killSwitch.reason}</p>}
								</div>
							)}
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
