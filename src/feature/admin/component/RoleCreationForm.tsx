import { useState } from 'react';
import { Button } from '@/shadcn/component/ui/button';
import { Input } from '@/shadcn/component/ui/input';
import { Textarea } from '@/shadcn/component/ui/textarea';
import { Label } from '@/shadcn/component/ui/label';
import { Alert, AlertDescription } from '@/shadcn/component/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shadcn/component/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shadcn/component/ui/dialog';
import { AlertCircle, Loader2, Eye, Save, Trash2 } from 'lucide-react';
import { BudgetSlidersGroup } from './BudgetSlider';
import { AiPreviewModal } from './AiPreviewModal';
import { validateBudget, type CareerTrack, type BudgetVector } from '../api/adminApi';
import { createTrack, updateTrack, deactivateTrack, getDeactivationWarning } from '../api/adminApi';

interface RoleCreationFormProps {
	initialTrack?: CareerTrack;
	onSuccess?: (track: CareerTrack) => void;
}

export function RoleCreationForm({ initialTrack, onSuccess }: RoleCreationFormProps) {
	const isEdit = !!initialTrack;
	const [formData, setFormData] = useState({
		name: initialTrack?.name || '',
		jobDescription: initialTrack?.jobDescription || '',
		gSkillDefinition: initialTrack?.gSkillDefinition || '',
		seedTier1: initialTrack?.seedTier1 || '',
		seedTier2: initialTrack?.seedTier2 || ''
	});
	
	const [budgets, setBudgets] = useState<{
		basic: BudgetVector;
		intermediate: BudgetVector;
		advanced: BudgetVector;
	}>({
		basic: initialTrack?.budgets.basic || { D: 25, C: 25, T: 25, G: 25 },
		intermediate: initialTrack?.budgets.intermediate || { D: 25, C: 25, T: 25, G: 25 },
		advanced: initialTrack?.budgets.advanced || { D: 25, C: 25, T: 25, G: 25 }
	});
	
	const [validations, setValidations] = useState<Record<string, { isValid: boolean; errors: string[]; warnings: string[] }>>({});
	const [submitting, setSubmitting] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [previewData, setPreviewData] = useState<{ examples: string[]; warning?: string } | null>(null);
	const [deactivateWarning, setDeactivateWarning] = useState<Awaited<ReturnType<typeof getDeactivationWarning>> | null>(null);
	const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

	// Validate budgets on change
const handleBudgetChange = async (milestone: string, budget: BudgetVector) => {
		setBudgets(prev => ({ ...prev, [milestone]: budget }));
		const validation = await validateBudget(budget);
		setValidations(prev => ({ ...prev, [milestone]: validation }));
	};

	const isAllValid = () => {
		// Check form fields
		if (!formData.name.trim()) return false;
		if (!formData.jobDescription.trim()) return false;
		if (!formData.gSkillDefinition.trim()) return false;
		if (!formData.seedTier1.trim()) return false;
		if (!formData.seedTier2.trim()) return false;
		
		// Check budgets
		return Object.values(validations).every(v => v.isValid);
	};

	const handleSubmit = async () => {
		if (!isAllValid()) return;
		
		setSubmitting(true);
		try {
			let result: CareerTrack;
			if (isEdit && initialTrack) {
				result = await updateTrack(initialTrack.id, {
					...formData,
					budgets
				});
			} else {
				result = await createTrack({
					...formData,
					budgets,
					isActive: true,
					createdBy: 'admin@tma.com.vn'
				});
			}
			onSuccess?.(result);
		} catch (error) {
			console.error('Save failed:', error);
			alert('Lưu thất bại. Vui lòng thử lại.');
		} finally {
			setSubmitting(false);
		}
	};

	const handlePreview = async () => {
		setShowPreview(true);
		try {
			const result = await (await import('../api/adminApi')).previewAiGeneration({
				jobDescription: formData.jobDescription,
				gSkillDefinition: formData.gSkillDefinition
			});
			setPreviewData(result);
		} catch (error) {
			console.error('Preview failed:', error);
			setPreviewData({ examples: ['Không thể tạo preview. Vui lòng thử lại.'] });
		}
	};

	const handleDeactivate = async () => {
		if (!initialTrack) return;
		setShowDeactivateConfirm(true);
		const warning = await getDeactivationWarning(initialTrack.id);
		setDeactivateWarning(warning);
	};

	const confirmDeactivate = async () => {
		if (!initialTrack) return;
		setSubmitting(true);
		try {
			await deactivateTrack(initialTrack.id);
			onSuccess?.({ ...initialTrack, isActive: false });
		} catch (error) {
			console.error('Deactivate failed:', error);
			alert('Tắt track thất bại.');
		} finally {
			setSubmitting(false);
			setShowDeactivateConfirm(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">
						{isEdit ? 'Chỉnh sửa Career Track' : 'Tạo Career Track mới'}
					</h2>
					<p className="text-gray-500 mt-1">
						{isEdit 
							? `Đang chỉnh sửa: ${initialTrack?.name} (${initialTrack?.activeLearnerCount || 0} học viên đang học)`
							: 'Điền thông tin role, ngân sách D/C/T/G, và preview AI trước khi lưu.'
						}
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={handlePreview} disabled={submitting}>
						<Eye className="w-4 h-4 mr-2" />
						Preview AI
					</Button>
					{isEdit && initialTrack?.isActive && (
						<Button variant="destructive" onClick={handleDeactivate} disabled={submitting}>
							<Trash2 className="w-4 h-4 mr-2" />
							Tắt track
						</Button>
					)}
				</div>
			</div>

			{/* Form Tabs */}
			<Tabs defaultValue="basic" className="space-y-6">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
					<TabsTrigger value="budget">Ngân sách D/C/T/G</TabsTrigger>
					<TabsTrigger value="seed">Seed Content</TabsTrigger>
				</TabsList>

				{/* Basic Info Tab */}
				<TabsContent value="basic" className="space-y-6 p-4 pt-0">
					<div className="space-y-4">
						<div>
							<Label className="block text-sm font-medium text-gray-700 mb-1">Tên Role *</Label>
							<Input
								placeholder="VD: Business Analyst, QA Engineer, DevOps..."
								value={formData.name}
								onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
								className="text-lg"
							/>
						</div>
						
						<div>
							<Label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</Label>
							<Textarea
								placeholder="Mô tả công việc chi tiết..."
								value={formData.jobDescription}
								onChange={e => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
								rows={6}
								className="resize-none"
							/>
							<p className="text-xs text-gray-500 mt-1">Mô tả sẽ được dùng để AI generate lesson content liên quan đến role này.</p>
						</div>
						
						<div>
							<Label className="block text-sm font-medium text-gray-700 mb-1">G-Skill Definition (Kỹ năng chuyên ngành) *</Label>
							<Textarea
								placeholder="VD: Eliciting requirements, clarifying scope, stakeholder communication, writing BRD/FSD..."
								value={formData.gSkillDefinition}
								onChange={e => setFormData(prev => ({ ...prev, gSkillDefinition: e.target.value }))}
								rows={4}
								className="resize-none"
							/>
							<p className="text-xs text-gray-500 mt-1">Định nghĩa kỹ năng trục G (chuyên ngành). Quan trọng để AI hiểu đúng context chuyên môn.</p>
						</div>
					</div>
				</TabsContent>

				{/* Budget Tab */}
				<TabsContent value="budget" className="space-y-6 p-4 pt-0">
					<BudgetSlidersGroup
						initialBudgets={budgets}
						onChange={handleBudgetChange}
						disabled={submitting}
					/>
				</TabsContent>

				{/* Seed Content Tab */}
				<TabsContent value="seed" className="space-y-6 p-4 pt-0">
					<div className="space-y-4">
						<div>
							<Label className="block text-sm font-medium text-gray-700 mb-1">Seed Tier 1 (Basic Vocabulary) *</Label>
							<Textarea
								placeholder="Từ vựng cơ bản, cấu trúc câu đơn giản... (cách nhau bằng dấu phẩy)"
								value={formData.seedTier1}
								onChange={e => setFormData(prev => ({ ...prev, seedTier1: e.target.value }))}
								rows={4}
								className="resize-none"
							/>
							<p className="text-xs text-gray-500 mt-1">Dùng cho các bài học level Basic (Vocabulary, Grammar, Reading cơ bản).</p>
						</div>
						
						<div>
							<Label className="block text-sm font-medium text-gray-700 mb-1">Seed Tier 2 (Advanced Terminology) *</Label>
							<Textarea
								placeholder="Thuật ngữ nâng cao, cấu trúc phức tạp... (cách nhau bằng dấu phẩy)"
								value={formData.seedTier2}
								onChange={e => setFormData(prev => ({ ...prev, seedTier2: e.target.value }))}
								rows={4}
								className="resize-none"
							/>
							<p className="text-xs text-gray-500 mt-1">Dùng cho các bài học level Intermediate/Advanced (Troubleshooting, Negotiation, Advanced topics).</p>
						</div>
					</div>
				</TabsContent>
			</Tabs>

			{/* Validation Summary */}
			{!isAllValid() && (
				<Alert variant="destructive" className="border-red-200">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription className="flex flex-col gap-1">
						<span className="font-medium">Form chưa hợp lệ:</span>
						<ul className="list-disc list-inside text-sm space-y-1">
							{!formData.name.trim() && <li>Chưa nhập tên Role</li>}
							{!formData.jobDescription.trim() && <li>Chưa nhập Job Description</li>}
							{!formData.gSkillDefinition.trim() && <li>Chưa nhập G-Skill Definition</li>}
							{!formData.seedTier1.trim() && <li>Chưa nhập Seed Tier 1</li>}
							{!formData.seedTier2.trim() && <li>Chưa nhập Seed Tier 2</li>}
							{Object.entries(validations).filter(([, v]) => !v.isValid).map(([k, v]) => (
								<li key={k}>{k}: {v.errors.join(', ')}</li>
							))}
						</ul>
					</AlertDescription>
				</Alert>
			)}

			{/* Action Buttons */}
			<div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
				<Button variant="outline" onClick={() => window.history.back()} disabled={submitting}>
					Hủy
				</Button>
				<Button 
					onClick={handleSubmit} 
					disabled={submitting || !isAllValid()}
					className="bg-blue-600 hover:bg-blue-700"
				>
					{submitting ? (
						<>
							<Loader2 className="w-4 h-4 animate-spin mr-2" />
							Đang lưu...
						</>
					) : (
						<>
							<Save className="w-4 h-4 mr-2" />
							{isEdit ? 'Cập nhật' : 'Tạo mới'}
						</>
					)}
				</Button>
			</div>

			{/* AI Preview Modal */}
			<AiPreviewModal
				isOpen={showPreview}
				onClose={() => setShowPreview(false)}
				data={previewData}
			/>

			{/* Deactivate Confirmation Modal */}
			<Dialog open={showDeactivateConfirm} onOpenChange={setShowDeactivateConfirm}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-red-600">
							<AlertCircle className="h-5 w-5" />
							Xác nhận tắt track
						</DialogTitle>
						<DialogDescription>
							Bạn sắp tắt track <strong>{initialTrack?.name}</strong>. Hành động này không thể hoàn tác.
						</DialogDescription>
					</DialogHeader>
					
					{deactivateWarning && (
						<div className="space-y-4 py-4">
							<Alert variant={deactivateWarning.hasActiveLearners ? 'default' : 'default'} className="border-amber-200 bg-amber-50">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription className="text-sm">
									{deactivateWarning.message}
								</AlertDescription>
							</Alert>
							
							{deactivateWarning.activeLearnersPreview.length > 0 && (
								<div className="text-sm">
									<p className="font-medium mb-2">Một số học viên đang học:</p>
									<ul className="space-y-1">
										{deactivateWarning.activeLearnersPreview.map(u => (
											<li key={u.id} className="text-gray-600">
												{u.name} ({u.email}) - {u.progress}% hoàn thành
											</li>
										))}
									</ul>
								</div>
							)}
						</div>
					)}
					
					<DialogFooter className="flex-col-reverse sm:flex-row gap-3">
						<Button variant="outline" onClick={() => setShowDeactivateConfirm(false)}>
							Hủy
						</Button>
						<Button variant="destructive" onClick={confirmDeactivate} disabled={submitting}>
							{submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Xác nhận tắt'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}