import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/shadcn/component/ui/button';
import { Input } from '@/shadcn/component/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shadcn/component/ui/select';
import { Badge } from '@/shadcn/component/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shadcn/component/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shadcn/component/ui/dialog';
import { AlertTriangle, CheckCircle, XCircle, Loader2, Copy, Eye } from 'lucide-react';
import { fetchRejectedContent, updateRejectedContentStatus, type RejectedContent } from '../api/adminApi';

export function RejectedContentTable() {
	const [items, setItems] = useState<RejectedContent[]>([]);
	const [loading, setLoading] = useState(true);
	const [filters, setFilters] = useState({ generator: 'all', status: 'all', role: '' });
	const [selectedItem, setSelectedItem] = useState<RejectedContent | null>(null);
	const [updating, setUpdating] = useState<string | null>(null);

	const loadItems = useCallback(async () => {
		setLoading(true);
		try {
			const data = await fetchRejectedContent(filters);
			setItems(data);
		} catch (error) {
			console.error('Failed to load rejected content:', error);
		} finally {
			setLoading(false);
		}
	}, [filters]);

	useEffect(() => {
		loadItems();
	}, [filters, loadItems]);

	const handleStatusChange = async (id: string, status: 'fixed' | 'ignored') => {
		setUpdating(id);
		try {
			const updated = await updateRejectedContentStatus(id, status);
			setItems(prev => prev.map(item => item.id === id ? updated : item));
		} catch (error) {
			console.error('Failed to update status:', error);
			alert('Cập nhật thất bại');
		} finally {
			setUpdating(null);
		}
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		alert('Đã copy vào clipboard');
	};

	const generatorLabels: Record<string, string> = {
		A: 'A - Placement Test',
		B1: 'B1 - Topic Outline',
		B2: 'B2 - Lesson Outline',
		C1: 'C1 - Theory',
		C2: 'C2 - Quiz',
		D1: 'D1 - Evaluator',
		D2: 'D2 - Advisor'
	};

	const statusLabels: Record<string, { label: string; color: string }> = {
		pending: { label: 'Chờ xử lý', color: 'bg-amber-100 text-amber-800' },
		fixed: { label: 'Đã sửa', color: 'bg-green-100 text-green-800' },
		ignored: { label: 'Bỏ qua', color: 'bg-gray-100 text-gray-600' }
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Filters */}
			<div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg border">
				<Select value={filters.generator} onValueChange={v => setFilters(f => ({ ...f, generator: v }))}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Generator" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Tất cả</SelectItem>
						<SelectItem value="A">A - Placement Test</SelectItem>
						<SelectItem value="B1">B1 - Topic Outline</SelectItem>
						<SelectItem value="B2">B2 - Lesson Outline</SelectItem>
						<SelectItem value="C1">C1 - Theory</SelectItem>
						<SelectItem value="C2">C2 - Quiz</SelectItem>
						<SelectItem value="D1">D1 - Evaluator</SelectItem>
						<SelectItem value="D2">D2 - Advisor</SelectItem>
					</SelectContent>
				</Select>

				<Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
					<SelectTrigger className="w-[140px]">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Tất cả</SelectItem>
						<SelectItem value="pending">Pending</SelectItem>
						<SelectItem value="fixed">Fixed</SelectItem>
						<SelectItem value="ignored">Ignored</SelectItem>
					</SelectContent>
				</Select>

				<Input
					placeholder="Lọc theo Role..."
					value={filters.role}
					onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}
					className="w-[200px]"
				/>

			<Button variant="outline" onClick={() => setFilters({ generator: 'all', status: 'all', role: '' })}>
				Clear
			</Button>
			</div>

			{/* Table */}
			<div className="overflow-x-auto rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow className="bg-gray-50">
							<TableHead className="w-20">Generator</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Error</TableHead>
							<TableHead>Time</TableHead>
							<TableHead className="w-24">Status</TableHead>
							<TableHead className="w-40">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-8 text-gray-500">
									Không có nội dung bị reject
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
									<TableCell className="text-sm text-gray-700">{item.role}</TableCell>
									<TableCell className="text-sm text-gray-600 max-w-xs truncate">
										{item.error}
									</TableCell>
									<TableCell className="text-sm text-gray-500 whitespace-nowrap">
										{new Date(item.timestamp).toLocaleString('vi-VN')}
									</TableCell>
									<TableCell>
										<Badge className={statusLabels[item.status]?.color || 'bg-gray-100 text-gray-600'}>
											{statusLabels[item.status]?.label || item.status}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => setSelectedItem(item)}
												className="h-8 w-8"
												title="Xem chi tiết"
											>
												<Eye className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => copyToClipboard(item.rawResponse)}
												className="h-8 w-8"
												title="Copy raw response"
											>
												<Copy className="h-4 w-4" />
											</Button>
											{item.status === 'pending' && (
												<>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleStatusChange(item.id, 'fixed')}
														disabled={updating === item.id}
														className="h-8 text-xs"
													>
														{updating === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Đã sửa'}
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleStatusChange(item.id, 'ignored')}
														disabled={updating === item.id}
														className="h-8 text-xs text-gray-500"
													>
														Bỏ qua
													</Button>
												</>
											)}
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Detail Modal */}
			<Dialog open={!!selectedItem} onOpenChange={open => !open && setSelectedItem(null)}>
				<DialogContent className="max-w-4xl max-h-[80vh]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-amber-600" />
							Chi tiết Rejected Content
						</DialogTitle>
						<DialogDescription>
							{generatorLabels[selectedItem?.generator || '']} - {selectedItem?.role}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 max-h-[60vh] overflow-y-auto">
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p className="text-gray-500">Generator</p>
								<p className="font-medium">{generatorLabels[selectedItem?.generator || '']}</p>
							</div>
							<div>
								<p className="text-gray-500">Role</p>
								<p className="font-medium">{selectedItem?.role}</p>
							</div>
							<div>
								<p className="text-gray-500">Status</p>
								<p className="font-medium">
									<Badge className={statusLabels[selectedItem?.status || '']?.color}>
										{statusLabels[selectedItem?.status || '']?.label}
									</Badge>
								</p>
							</div>
							<div>
								<p className="text-gray-500">Timestamp</p>
								<p className="font-medium">{selectedItem ? new Date(selectedItem.timestamp).toLocaleString('vi-VN') : ''}</p>
							</div>
						</div>

						<div>
							<p className="text-sm font-medium text-gray-500 mb-2">Input Preview</p>
							<pre className="p-3 rounded bg-gray-100 text-xs overflow-x-auto max-h-40 overflow-y-auto">
								{selectedItem?.inputPreview}
							</pre>
						</div>

						<div>
							<p className="text-sm font-medium text-gray-500 mb-2">Error</p>
							<div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
								{selectedItem?.error}
							</div>
						</div>

						<div>
							<p className="text-sm font-medium text-gray-500 mb-2">Raw AI Response</p>
							<pre className="p-3 rounded bg-gray-100 text-xs overflow-x-auto max-h-60 overflow-y-auto font-mono">
								{selectedItem?.rawResponse}
							</pre>
						</div>

						<div>
							<p className="text-sm font-medium text-gray-500 mb-2">Validator Checks</p>
							<div className="space-y-2">
								{selectedItem?.validatorChecks.map((check, idx) => (
									<div key={idx} className="flex items-center gap-2 p-2 rounded bg-white border">
										{check.passed ? (
											<CheckCircle className="h-4 w-4 text-green-500" />
										) : (
											<XCircle className="h-4 w-4 text-red-500" />
										)}
										<span className="text-sm font-medium">{check.check}</span>
										{check.details && <span className="text-xs text-gray-500 ml-auto">{check.details}</span>}
									</div>
								))}
							</div>
						</div>
					</div>

					<DialogFooter>
						{selectedItem?.status === 'pending' && (
							<>
								<Button variant="outline" onClick={() => handleStatusChange(selectedItem!.id, 'ignored')}>
									Bỏ qua
								</Button>
								<Button onClick={() => handleStatusChange(selectedItem!.id, 'fixed')}>
									Đã sửa
								</Button>
							</>
						)}
						<Button variant="outline" onClick={() => setSelectedItem(null)}>
							Đóng
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}