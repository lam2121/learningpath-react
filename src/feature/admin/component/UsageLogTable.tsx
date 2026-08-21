import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/shadcn/component/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shadcn/component/ui/select';
import { Badge } from '@/shadcn/component/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shadcn/component/ui/table';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/shadcn/component/ui/alert-dialog';
import { Coins, Database, Loader2, Trash2 } from 'lucide-react';
import {
	fetchUsageLogs,
	deleteUsageLog,
	clearUsageLogs,
	fetchTracks,
	type UsageLog,
} from '../api/adminApi';

const generatorLabels: Record<string, string> = {
	A: 'A - Placement Test',
	B1: 'B1 - Topic Outline',
	B2: 'B2 - Lesson Outline',
	C1: 'C1 - Theory',
	C2: 'C2 - Quiz',
};

const statusStyles: Record<string, string> = {
	success: 'bg-green-100 text-green-800',
	retry: 'bg-amber-100 text-amber-800',
	rejected: 'bg-red-100 text-red-800',
	fallback: 'bg-gray-100 text-gray-600',
};

function formatCost(usd: number) {
	if (usd > 0 && usd < 0.0001) return '<$0.0001';
	return `$${usd.toFixed(4)}`;
}

function roleFilterValue(roleId: string): number | null {
	return roleId && roleId !== 'all' ? Number(roleId) : null;
}

export function UsageLogTable() {
	const [items, setItems] = useState<UsageLog[]>([]);
	const [tracks, setTracks] = useState<{ id: number; name: string }[]>([]);
	const [loading, setLoading] = useState(true);
	const [filters, setFilters] = useState({ generator: 'all', status: 'all', roleId: 'all' });
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [clearing, setClearing] = useState(false);
	const [pendingDelete, setPendingDelete] = useState<UsageLog | null>(null);
	const [showClearAll, setShowClearAll] = useState(false);
	const [showClearFiltered, setShowClearFiltered] = useState(false);
	const requestSeq = useRef(0);

	const loadItems = useCallback(async (flt: { generator: string; status: string; roleId: string }) => {
		setLoading(true);
		const seq = ++requestSeq.current;
		try {
			const data = await fetchUsageLogs({
				generator: flt.generator,
				status: flt.status,
				roleId: roleFilterValue(flt.roleId),
			});
			if (seq === requestSeq.current) setItems(data);
		} catch (error) {
			if (seq === requestSeq.current) console.error('Failed to load usage logs:', error);
		} finally {
			if (seq === requestSeq.current) setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadItems(filters);
	}, [filters, loadItems]);

	useEffect(() => {
		fetchTracks()
			.then(data => setTracks(data.map(t => ({ id: t.id, name: t.name }))))
			.catch(error => console.error('Failed to load tracks:', error));
	}, []);

	const summary = useMemo(() => {
		let totalTokens = 0;
		let totalCost = 0;
		for (const item of items) {
			totalTokens += item.promptTokens + item.completionTokens;
			totalCost += item.costUsd;
		}
		return { totalTokens, totalCost };
	}, [items]);

	const hasActiveFilters =
		filters.generator !== 'all' || filters.status !== 'all' || filters.roleId !== 'all';

	const handleConfirmDelete = async () => {
		if (!pendingDelete) return;
		setDeletingId(pendingDelete.id);
		try {
			await deleteUsageLog(pendingDelete.id);
			setItems(prev => prev.filter(item => item.id !== pendingDelete.id));
		} catch (error) {
			console.error('Failed to delete usage log:', error);
			alert('Delete failed');
		} finally {
			setDeletingId(null);
			setPendingDelete(null);
		}
	};

	const handleClear = async (filtered: boolean) => {
		setClearing(true);
		try {
			const result = await clearUsageLogs(
				filtered
					? {
							generator: filters.generator,
							status: filters.status,
							roleId: roleFilterValue(filters.roleId),
						}
					: undefined,
			);
			alert(`Deleted ${result.deletedCount} log record${result.deletedCount === 1 ? '' : 's'}`);
			await loadItems(filtered ? filters : { generator: 'all', status: 'all', roleId: 'all' });
			if (!filtered) setFilters({ generator: 'all', status: 'all', roleId: 'all' });
		} catch (error) {
			console.error('Failed to clear usage logs:', error);
			alert('Clear failed');
		} finally {
			setClearing(false);
			setShowClearAll(false);
			setShowClearFiltered(false);
		}
	};

	return (
		<div className="space-y-4">
			{/* Summary */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
					<div className="p-2.5 rounded-lg bg-blue-50">
						<Database className="h-5 w-5 text-blue-600" />
					</div>
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Loaded Records</p>
						<p className="text-lg font-bold text-gray-900">{items.length}</p>
					</div>
				</div>
				<div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
					<div className="p-2.5 rounded-lg bg-indigo-50">
						<Coins className="h-5 w-5 text-indigo-600" />
					</div>
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Tokens</p>
						<p className="text-lg font-bold text-gray-900">{summary.totalTokens.toLocaleString()}</p>
					</div>
				</div>
				<div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
					<div className="p-2.5 rounded-lg bg-green-50">
						<span className="text-sm font-bold text-green-700">$</span>
					</div>
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Cost</p>
						<p className="text-lg font-bold text-gray-900">{formatCost(summary.totalCost)}</p>
					</div>
				</div>
			</div>

			{/* Filters + danger actions */}
			<div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg border">
				<Select value={filters.generator} onValueChange={v => setFilters(f => ({ ...f, generator: v }))}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Generator" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Generators</SelectItem>
						<SelectItem value="A">A - Placement Test</SelectItem>
						<SelectItem value="B1">B1 - Topic Outline</SelectItem>
						<SelectItem value="B2">B2 - Lesson Outline</SelectItem>
						<SelectItem value="C1">C1 - Theory</SelectItem>
						<SelectItem value="C2">C2 - Quiz</SelectItem>
					</SelectContent>
				</Select>

				<Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
					<SelectTrigger className="w-[140px]">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Statuses</SelectItem>
						<SelectItem value="success">Success</SelectItem>
						<SelectItem value="retry">Retry</SelectItem>
						<SelectItem value="rejected">Rejected</SelectItem>
						<SelectItem value="fallback">Fallback</SelectItem>
					</SelectContent>
				</Select>

				<Select value={filters.roleId} onValueChange={v => setFilters(f => ({ ...f, roleId: v }))}>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder="Role" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Roles</SelectItem>
						{tracks.map(track => (
							<SelectItem key={track.id} value={String(track.id)}>
								{track.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Button variant="outline" onClick={() => setFilters({ generator: 'all', status: 'all', roleId: 'all' })}>
					Clear Filters
				</Button>

				<div className="ml-auto flex items-center gap-2">
					<Button
						variant="outline"
						className="border-red-200 text-red-600 hover:bg-red-50"
						disabled={!hasActiveFilters || clearing}
						onClick={() => setShowClearFiltered(true)}
					>
						{clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
						Clear Filtered
					</Button>
					<Button
						variant="destructive"
						disabled={clearing}
						onClick={() => setShowClearAll(true)}
					>
						<Trash2 className="h-4 w-4" />
						Clear All
					</Button>
				</div>
			</div>

			{/* Table */}
			{loading ? (
				<div className="flex items-center justify-center h-64">
					<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
				</div>
			) : (
				<div className="overflow-x-auto rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow className="bg-gray-50">
								<TableHead className="w-20">Generator</TableHead>
								<TableHead>Model</TableHead>
								<TableHead>Role</TableHead>
								<TableHead className="text-right">Tokens (P/C)</TableHead>
								<TableHead className="text-right">Cost</TableHead>
								<TableHead className="w-24">Status</TableHead>
								<TableHead>Time</TableHead>
								<TableHead className="w-16">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.length === 0 ? (
								<TableRow>
									<TableCell colSpan={8} className="text-center py-8 text-gray-500">
										No usage logs
									</TableCell>
								</TableRow>
							) : (
								items.map(item => (
									<TableRow key={item.id} className="hover:bg-gray-50">
										<TableCell className="font-mono text-xs">
											<Badge variant="outline" className="px-2 py-0.5 text-xs">
												{generatorLabels[item.generator] || item.generator}
											</Badge>
										</TableCell>
										<TableCell className="text-xs font-mono text-gray-600 max-w-[220px] truncate" title={item.model}>
											{item.model}
										</TableCell>
										<TableCell className="text-sm text-gray-700">{item.roleName || '-'}</TableCell>
										<TableCell className="text-sm text-gray-600 text-right whitespace-nowrap font-mono">
											{item.promptTokens.toLocaleString()} / {item.completionTokens.toLocaleString()}
										</TableCell>
										<TableCell className="text-sm text-gray-900 text-right whitespace-nowrap font-mono">
											{formatCost(item.costUsd)}
										</TableCell>
										<TableCell>
											<Badge className={statusStyles[item.status] || 'bg-gray-100 text-gray-600'}>
												{item.status}
											</Badge>
										</TableCell>
										<TableCell className="text-sm text-gray-500 whitespace-nowrap">
											{new Date(item.createdAt).toLocaleString('vi-VN')}
										</TableCell>
										<TableCell>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => setPendingDelete(item)}
												disabled={deletingId === item.id}
												className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
												title="Delete record"
											>
												{deletingId === item.id ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Trash2 className="h-4 w-4" />
												)}
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Delete single record */}
			<AlertDialog open={!!pendingDelete} onOpenChange={open => !open && setPendingDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this usage log?</AlertDialogTitle>
						<AlertDialogDescription>
							Record #{pendingDelete?.id} ({generatorLabels[pendingDelete?.generator || ''] || pendingDelete?.generator}
							{' · '}
							{formatCost(pendingDelete?.costUsd ?? 0)}) will be permanently removed. This cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleConfirmDelete}>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Clear filtered */}
			<AlertDialog open={showClearFiltered} onOpenChange={setShowClearFiltered}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete all logs matching the current filters?</AlertDialogTitle>
						<AlertDialogDescription>
							Every record matching the active filters will be permanently deleted. AI Costs dashboard totals are
							computed from these logs and will change accordingly. This cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleClear(true)}>
							Delete Filtered Logs
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Clear all */}
			<AlertDialog open={showClearAll} onOpenChange={setShowClearAll}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete the ENTIRE usage log table?</AlertDialogTitle>
						<AlertDialogDescription>
							All AI call history will be permanently deleted. The AI Costs dashboard and admin dashboard stats are
							computed from these logs and will reset. This cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleClear(false)}>
							Delete Everything
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
