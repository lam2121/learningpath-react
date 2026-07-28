import { useState, useEffect } from 'react';
import { cn } from '@/shadcn/lib/util';
import { Card, CardContent, CardHeader, CardTitle } from '@/shadcn/component/ui/card';
import { Badge } from '@/shadcn/component/ui/badge';
import { Alert, AlertDescription } from '@/shadcn/component/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shadcn/component/ui/tabs';
import { Progress } from '@/shadcn/component/ui/progress';
import { KillSwitchToggle } from './KillSwitchToggle';
import { AlertTriangle, DollarSign, TrendingUp, Activity, Loader2, Zap } from 'lucide-react';
import { fetchCostDashboard, toggleKillSwitch, type CostDashboardData, type KillSwitchState } from '../api/adminApi';
import { Button } from '@/shadcn/component/ui/button';

export function CostDashboard() {
	const [data, setData] = useState<CostDashboardData | null>(null);
	const [loading, setLoading] = useState(true);
	const [killSwitch, setKillSwitch] = useState<KillSwitchState>({ enabled: false });
	const [toggling, setToggling] = useState(false);
	const days = 30;

	useEffect(() => {
		loadData();
		loadKillSwitch();
		
		// Listen for kill switch changes from other tabs
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
			const state = await (await import('../api/adminApi')).fetchKillSwitchState();
			setKillSwitch(state);
		} catch (error) {
			console.error('Failed to load kill switch:', error);
		}
	};

	const handleToggleKillSwitch = async (enabled: boolean) => {
		setToggling(true);
		try {
			const result = await toggleKillSwitch(enabled, enabled ? 'Manual toggle by admin' : 'Manual toggle by admin');
			setKillSwitch(result);
		} catch (error) {
			console.error('Failed to toggle kill switch:', error);
		} finally {
			setToggling(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="w-8 h-8 animate-spin text-blue-600" />
			</div>
		);
	}

	if (!data) {
		return (
			<div className="text-center py-12 text-gray-500">
				Không thể tải dữ liệu chi phí
			</div>
		);
	}

	const avg7d = data.dailyCosts.slice(-7).reduce((a, b) => a + b.total, 0) / 7;
	const yesterday = data.dailyCosts[data.dailyCosts.length - 1];
	const yesterdayCost = yesterday?.total || 0;
	const spikePercent = avg7d > 0 ? ((yesterdayCost / avg7d) - 1) * 100 : 0;
	const isSpike = spikePercent > 50;

	return (
		<div className="space-y-6">
			{/* Header with Kill Switch */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">AI Cost Dashboard</h2>
					<p className="text-gray-500">Theo dõi chi phí AI theo generator ({days} ngày gần nhất)</p>
				</div>
				<KillSwitchToggle 
					enabled={killSwitch.enabled} 
					onToggle={handleToggleKillSwitch} 
					disabled={toggling}
				/>
			</div>

			{/* Alert Banner */}
			{isSpike && (
				<Alert variant="destructive" className="border-red-200">
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription className="flex items-center gap-2">
						<strong>Cảnh báo chi phí:</strong> 
						Hôm qua chi phí ${yesterdayCost.toFixed(2)} vượt {spikePercent.toFixed(0)}% so với trung bình 7 ngày (${avg7d.toFixed(2)}).
						{data.alerts.length > 0 && (
							<Button variant="link" className="ml-2 h-auto p-0 text-xs">
								Xem chi tiết
							</Button>
						)}
					</AlertDescription>
				</Alert>
			)}

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-gray-500">Tổng 30 ngày</CardTitle>
						<DollarSign className="h-4 w-4 text-gray-400" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-gray-900">${data.totalCost30d.toFixed(2)}</div>
						<p className="text-xs text-gray-500">TB/ngày: ${data.dailyAverage.toFixed(2)}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-gray-500">Hôm qua</CardTitle>
						<TrendingUp className="h-4 w-4 text-gray-400" />
					</CardHeader>
					<CardContent>
						<div className={cn(
							'text-3xl font-bold',
							isSpike ? 'text-red-600' : 'text-green-600'
						)}>
							${yesterdayCost.toFixed(2)}
						</div>
						<p className="text-xs text-gray-500">TB 7 ngày: ${avg7d.toFixed(2)}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-gray-500">Generator Types</CardTitle>
						<Activity className="h-4 w-4 text-gray-400" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-gray-900">{data.generatorBreakdown.length}</div>
						<p className="text-xs text-gray-500">Loại prompt đang hoạt động</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-gray-500">Kill Switch</CardTitle>
						<Zap className="h-4 w-4 text-gray-400" />
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<Badge variant={killSwitch.enabled ? 'destructive' : 'default'} className="text-base px-3 py-1">
								{killSwitch.enabled ? 'BẬT' : 'TẮT'}
							</Badge>
							{killSwitch.enabledAt && (
								<span className="text-xs text-gray-500">
									Từ {new Date(killSwitch.enabledAt).toLocaleString('vi-VN')}
								</span>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="daily" className="space-y-6">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="daily">Biểu đồ hàng ngày</TabsTrigger>
					<TabsTrigger value="generator">Theo Generator</TabsTrigger>
					<TabsTrigger value="alerts">Cảnh báo</TabsTrigger>
				</TabsList>

				{/* Daily Costs Tab */}
				<TabsContent value="daily" className="space-y-4">
					<div className="space-y-3">
						{data.dailyCosts.slice().reverse().map((day, idx) => {
							const isYesterday = idx === 0;
							const isSpikeDay = day.total > avg7d * 1.5;
							return (
								<div key={day.date} className={cn(
									'p-4 rounded-lg border flex items-center justify-between gap-4',
									isYesterday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100',
									isSpikeDay && !isYesterday ? 'bg-amber-50 border-amber-200' : ''
								)}>
									<div className="flex items-center gap-3 min-w-[180px]">
										<div className={cn(
											'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
											isSpikeDay ? 'bg-amber-100' : isYesterday ? 'bg-blue-100' : 'bg-gray-100'
										)}>
											<DollarSign className={cn('w-5 h-5', isSpikeDay ? 'text-amber-600' : isYesterday ? 'text-blue-600' : 'text-gray-500')} />
										</div>
										<div>
											<p className="font-medium text-gray-900">{new Date(day.date).toLocaleDateString('vi-VN')}</p>
											<p className="text-xs text-gray-500">{isYesterday ? 'Hôm qua' : isSpikeDay ? 'Vượt ngưỡng' : 'Bình thường'}</p>
										</div>
									</div>
									
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											<Progress value={(day.total / (data.dailyAverage * 3 || 1)) * 100} className="h-2 flex-1 max-w-xs" />
											<span className="text-sm font-bold tabular-nums w-20 text-right">
												${day.total.toFixed(2)}
											</span>
										</div>
									</div>

									<div className="flex items-center gap-1 text-xs text-gray-500 flex-wrap">
										{Object.entries(day.byGenerator).map(([gen, cost]) => (
											<Badge key={gen} variant="outline" className="px-2 py-0.5 text-xs h-auto">
												{gen}: ${cost.toFixed(2)}
											</Badge>
										))}
									</div>
								</div>
							);
						})}
					</div>
				</TabsContent>

				{/* Generator Breakdown Tab */}
				<TabsContent value="generator" className="space-y-4">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="text-left text-gray-500 border-b border-gray-100">
									<th className="pb-2">Generator</th>
									<th className="pb-2 text-right">Số lần gọi</th>
									<th className="pb-2 text-right">Total Tokens</th>
									<th className="pb-2 text-right">Tổng chi phí</th>
									<th className="pb-2 text-right">Chi phí TB</th>
									<th className="pb-2 text-right">% Tổng</th>
								</tr>
							</thead>
							<tbody>
								{data.generatorBreakdown.map((gen) => (
									<tr key={gen.generator} className="border-b border-gray-50">
										<td className="py-3 font-medium">
											<div className="flex items-center gap-2">
												<Badge variant="outline" className="px-2 py-0.5 text-xs">{gen.generator}</Badge>
												<span className="text-gray-500">
													{gen.generator === 'A' && 'Placement Test'}
													{gen.generator === 'B1' && 'Topic Outline'}
													{gen.generator === 'B2' && 'Lesson Outline'}
													{gen.generator === 'C1' && 'Theory'}
													{gen.generator === 'C2' && 'Quiz'}
													{gen.generator === 'D1' && 'Evaluator'}
													{gen.generator === 'D2' && 'Advisor'}
												</span>
											</div>
										</td>
										<td className="py-3 text-right tabular-nums">{gen.count.toLocaleString()}</td>
										<td className="py-3 text-right tabular-nums">{gen.totalTokens.toLocaleString()}</td>
										<td className="py-3 text-right tabular-nums font-medium">${gen.totalCost.toFixed(2)}</td>
										<td className="py-3 text-right tabular-nums">${gen.avgCost.toFixed(4)}</td>
										<td className="py-3 text-right tabular-nums">
											{(data.totalCost30d > 0 ? (gen.totalCost / data.totalCost30d) * 100 : 0).toFixed(1)}%
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</TabsContent>

				{/* Alerts Tab */}
				<TabsContent value="alerts" className="space-y-4">
					{data.alerts.length === 0 ? (
						<div className="text-center py-12 text-gray-500">
							<AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
							<p>Không có cảnh báo nào</p>
						</div>
					) : (
						<div className="space-y-3">
							{data.alerts.map((alert, idx) => (
								<Alert key={idx} variant={alert.type === 'spike' ? 'destructive' : 'default'} className="border-amber-200 bg-amber-50">
									<AlertTriangle className="h-4 w-4" />
									<AlertDescription className="flex items-center justify-between">
										<span>{alert.message}</span>
										<span className="text-xs text-gray-500">{new Date(alert.date).toLocaleDateString('vi-VN')}</span>
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