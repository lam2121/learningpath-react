import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Tooltip as RechartsTooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { Activity } from 'lucide-react';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/shadcn/component/ui/table';

import { formatCost, formatCostShort, formatTokens } from '../lib/labels';
import type { CostGroup } from '../type/Admin';

interface CostBreakdownPanelProps {
	groups: CostGroup[];
	/** Column header for the grouping key, e.g. "Model". */
	keyHeader: string;
	/** Optional prettifier for a key (generator codes, role ids, ...). */
	renderKey?: (group: CostGroup) => string;
	emptyMessage?: string;
}

/**
 * Ranked bar chart + table for one cost dimension.
 *
 * One component serves generator / model / provider / track / status so the
 * five breakdowns can't drift apart.
 */
export function CostBreakdownPanel({
	groups,
	keyHeader,
	renderKey,
	emptyMessage = 'No spend recorded for these filters.',
}: CostBreakdownPanelProps) {
	const label = (group: CostGroup) => renderKey?.(group) ?? group.label ?? group.key;

	if (groups.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 py-12 text-center">
				<Activity className="h-6 w-6 text-slate-300 dark:text-slate-600" />
				<p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
			</div>
		);
	}

	// Cap the chart so a long tail (16 models) stays readable; the table shows all.
	const charted = groups.slice(0, 10).map(group => ({ ...group, name: label(group) }));
	const chartHeight = Math.max(200, charted.length * 34 + 40);

	return (
		<div className="grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
			<div>
				<p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
					Spend share{groups.length > 10 ? ' (top 10)' : ''}
				</p>
				<div style={{ height: chartHeight }}>
					<ResponsiveContainer width="100%" height="100%">
						<BarChart layout="vertical" data={charted} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
							<CartesianGrid horizontal={false} stroke="rgba(148,163,184,0.16)" />
							<XAxis type="number" hide />
							<YAxis
								type="category"
								dataKey="name"
								axisLine={false}
								tickLine={false}
								width={130}
								tick={{ fill: '#64748b', fontSize: 11 }}
							/>
							<RechartsTooltip
								cursor={{ fill: 'rgba(148,163,184,0.08)' }}
								formatter={(value) => [formatCost(Number(value ?? 0)), 'Cost']}
							/>
							<Bar dataKey="totalCost" radius={[0, 6, 6, 0]}>
								{charted.map((group, index) => (
									<Cell key={group.key} fill={`var(--color-chart-${(index % 5) + 1})`} />
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>

			<div className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{keyHeader}</TableHead>
							<TableHead className="text-right">Calls</TableHead>
							<TableHead className="text-right">Tokens</TableHead>
							<TableHead className="text-right">Cost</TableHead>
							<TableHead className="text-right">Avg / call</TableHead>
							<TableHead className="text-right">Share</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{groups.map(group => (
							<TableRow key={group.key}>
								<TableCell className="font-medium">{label(group)}</TableCell>
								<TableCell className="text-right tabular-nums">{group.count.toLocaleString()}</TableCell>
								<TableCell className="text-right tabular-nums">{formatTokens(group.totalTokens)}</TableCell>
								<TableCell className="text-right tabular-nums font-semibold">{formatCostShort(group.totalCost)}</TableCell>
								<TableCell className="text-right tabular-nums text-gray-500 dark:text-gray-400">{formatCost(group.avgCost)}</TableCell>
								<TableCell className="text-right tabular-nums text-gray-500">{group.share.toFixed(1)}%</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
