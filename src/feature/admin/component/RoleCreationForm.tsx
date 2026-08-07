import { useState, useCallback } from 'react';
import { Button } from '@/shadcn/component/ui/button';
import { Input } from '@/shadcn/component/ui/input';
import { Textarea } from '@/shadcn/component/ui/textarea';
import { Label } from '@/shadcn/component/ui/label';
import { Alert, AlertDescription } from '@/shadcn/component/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shadcn/component/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shadcn/component/ui/dialog';
import { AlertCircle, Loader2, Eye, Save, Trash2, RotateCcw } from 'lucide-react';
import { BudgetSlidersGroup } from './BudgetSlider';
import { AiPreviewModal } from './AiPreviewModal';
import { type CareerTrack, type BudgetVector, DEFAULT_BASELINE } from '../api/adminApi';
import { createTrack, updateTrack, deactivateTrack, activateTrack, getDeactivationWarning } from '../api/adminApi';

interface RoleCreationFormProps {
	initialTrack?: CareerTrack;
	onSuccess?: (track?: CareerTrack) => void;
}

export function RoleCreationForm({ initialTrack, onSuccess }: RoleCreationFormProps) {
	const isEdit = !!initialTrack;
	const [formData, setFormData] = useState({
		name: initialTrack?.name || '',
		jobDescription: initialTrack?.jobDescription || '',
		gSkillDefinition: initialTrack?.gSkillDefinition || '',
		seedTier1: initialTrack?.seedTier1 || '',
		seedTier2: initialTrack?.seedTier2 || '',
		exampleQuestion1: initialTrack?.exampleQuestion?.[0] || '',
		exampleQuestion2: initialTrack?.exampleQuestion?.[1] || ''
	});
	
  const [baselineBudget, setBaselineBudget] = useState<BudgetVector>(() => {
    return initialTrack?.baseline ? { ...initialTrack.baseline } : { ...DEFAULT_BASELINE };
  });

  const [validations] = useState<Record<string, { isValid: boolean; errors: string[]; warnings: string[] }>>({});
	const [submitting, setSubmitting] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [previewData, setPreviewData] = useState<{ examples: string[]; warning?: string } | null>(null);
	const [deactivateWarning, setDeactivateWarning] = useState<Awaited<ReturnType<typeof getDeactivationWarning>> | null>(null);
	const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

	// Validate budgets on change
  const handleBudgetChange = useCallback((budget: BudgetVector) => {
    setBaselineBudget(budget);
  }, []);

  const isAllValid = () => {
    // Check form fields
    if (!formData.name.trim()) return false;
    if (!formData.jobDescription.trim()) return false;
    if (!formData.gSkillDefinition.trim()) return false;
    if (!formData.seedTier1.trim()) return false;
    if (!formData.seedTier2.trim()) return false;
    
    // Check budgets (validate sum, floor, and step of 5)
    const values = Object.values(baselineBudget);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const isValidSum = Math.abs(sum - 100) < 0.1;
    const isValidFloor = values.every((value) => value >= 10);
    const isValidStep = values.every((value) => value % 5 === 0);
    
    return isValidSum && isValidFloor && isValidStep;
  };

	const handleSubmit = async () => {
		if (!isAllValid()) return;
		
		setSubmitting(true);
		try {
			const payload = {
				name: formData.name,
				job_description: formData.jobDescription,
				baseline: baselineBudget,
				g_skill_description: formData.gSkillDefinition,
				seed_tier_1: formData.seedTier1,
				seed_tier_2: formData.seedTier2,
				example_question: (formData.exampleQuestion1 || formData.exampleQuestion2)
					? [formData.exampleQuestion1, formData.exampleQuestion2].filter(Boolean)
					: [],
			};
			let result: CareerTrack;
			if (isEdit && initialTrack) {
				result = await updateTrack(initialTrack.id, {
					...payload,
					is_active: initialTrack.isActive,
				});
			} else {
				result = await createTrack(payload);
			}
			onSuccess?.(result);
		} catch (error) {
			console.error('Save failed:', error);
			alert('Save failed. Please try again.');
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
			setPreviewData({ examples: ['Cannot generate preview. Please try again.'] });
		}
	};

	const handleDeactivate = async () => {
		if (!initialTrack) return;
		setShowDeactivateConfirm(true);
		const warning = await getDeactivationWarning(initialTrack.id);
		setDeactivateWarning(warning);
	};

	const handleActivate = async () => {
		if (!initialTrack) return;
		setSubmitting(true);
		try {
			await activateTrack(initialTrack.id);
			onSuccess?.({ ...initialTrack, isActive: true });
		} catch (error) {
			console.error('Activate failed:', error);
			alert('Activate track failed.');
		} finally {
			setSubmitting(false);
		}
	};

	const confirmDeactivate = async () => {
		if (!initialTrack) return;
		setSubmitting(true);
		try {
			await deactivateTrack(initialTrack.id);
			onSuccess?.({ ...initialTrack, isActive: false });
		} catch (error) {
			console.error('Deactivate failed:', error);
			alert('Deactivate track failed.');
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
						{isEdit ? 'Edit Career Track' : 'Create New Career Track'}
					</h2>
					<p className="text-gray-500 mt-1">
						{isEdit 
							? `Editing: ${initialTrack?.name} (${initialTrack?.activeLearnerCount || 0} learners active)`
							: 'Enter role info, D/C/T/G budget, and AI preview before saving.'
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
								Deactivate Track
							</Button>
					)}
					{isEdit && !initialTrack?.isActive && (
						<Button variant="outline" className="text-green-600 border-green-300 hover:bg-green-50" onClick={handleActivate} disabled={submitting}>
							<RotateCcw className="w-4 h-4 mr-2" />
							Reactivate Track
						</Button>
					)}
				</div>
			</div>

			{/* Form Tabs */}
			<Tabs defaultValue="basic" className="space-y-6">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="basic">Basic Info</TabsTrigger>
					<TabsTrigger value="budget">D/C/T/G Budget</TabsTrigger>
					<TabsTrigger value="seed">Seed Content</TabsTrigger>
				</TabsList>

				{/* Basic Info Tab */}
				<TabsContent value="basic" className="space-y-6 p-4 pt-0">
					<div className="space-y-4">
						<div>
							<Label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</Label>
							<Input
								placeholder="e.g., Business Analyst, QA Engineer, DevOps..."
								value={formData.name}
								onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
								className="text-lg"
							/>
						</div>
						
						<div>
							<Label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</Label>
							<Textarea
								placeholder="Detailed job description..."
								value={formData.jobDescription}
								onChange={e => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
								rows={6}
								className="resize-none"
							/>
							<p className="text-xs text-gray-500 mt-1">Description will be used to AI generate lesson content related to this role.</p>
						</div>
						
						<div>
							<Label className="block text-sm font-medium text-gray-700 mb-1">G-Skill Definition (Professional Skill) *</Label>
							<Textarea
								placeholder="e.g., Eliciting requirements, clarifying scope, stakeholder communication, writing BRD/FSD..."
								value={formData.gSkillDefinition}
								onChange={e => setFormData(prev => ({ ...prev, gSkillDefinition: e.target.value }))}
								rows={4}
								className="resize-none"
							/>
							<p className="text-xs text-gray-500 mt-1">Definition of G-skill (professional). Important for AI to understand correct professional context.</p>
						</div>
					</div>
				</TabsContent>

				{/* Budget Tab */}
				<TabsContent value="budget" className="space-y-6 p-4 pt-0">
        <BudgetSlidersGroup
          initialBudget={baselineBudget}
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
								placeholder="Basic vocabulary, simple sentence structures... (separated by commas)"
								value={formData.seedTier1}
								onChange={e => setFormData(prev => ({ ...prev, seedTier1: e.target.value }))}
								rows={4}
								className="resize-none"
							/>
							<p className="text-xs text-gray-500 mt-1">Used for Basic level lessons (Vocabulary, Grammar, Basic Reading).</p>
						</div>
						
						<div>
							<Label className="block text-sm font-medium text-gray-700 mb-1">Seed Tier 2 (Advanced Terminology) *</Label>
							<Textarea
								placeholder="Advanced terminology, complex structures... (separated by commas)"
								value={formData.seedTier2}
								onChange={e => setFormData(prev => ({ ...prev, seedTier2: e.target.value }))}
								rows={4}
								className="resize-none"
							/>
							<p className="text-xs text-gray-500 mt-1">Used for Intermediate/Advanced level lessons (Troubleshooting, Negotiation, Advanced topics).</p>
						</div>

						<div>
							<Label className="block text-sm font-medium text-gray-700 mb-1">Example Question 1</Label>
							<Input
								placeholder="e.g., How would you explain a project delay to a client?"
								value={formData.exampleQuestion1}
								onChange={e => setFormData(prev => ({ ...prev, exampleQuestion1: e.target.value }))}
							/>
							<p className="text-xs text-gray-500 mt-1">Shown on learner role selection cards. Optional.</p>
						</div>

						<div>
							<Label className="block text-sm font-medium text-gray-700 mb-1">Example Question 2</Label>
							<Input
								placeholder="e.g., How do you negotiate a scope change?"
								value={formData.exampleQuestion2}
								onChange={e => setFormData(prev => ({ ...prev, exampleQuestion2: e.target.value }))}
							/>
							<p className="text-xs text-gray-500 mt-1">Shown on learner role selection cards. Optional.</p>
						</div>
					</div>
				</TabsContent>
			</Tabs>

			{/* Validation Summary */}
			{!isAllValid() && (
				<Alert variant="destructive" className="border-red-200">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription className="flex flex-col gap-1">
						<span className="font-medium">Form invalid:</span>
<ul className="list-disc list-inside text-sm space-y-1">
									{!formData.name.trim() && <li>Role name not entered</li>}
									{!formData.jobDescription.trim() && <li>Job description not entered</li>}
									{!formData.gSkillDefinition.trim() && <li>G-skill definition not entered</li>}
								{!formData.seedTier1.trim() && <li>Seed Tier 1 not entered</li>}
								{!formData.seedTier2.trim() && <li>Seed Tier 2 not entered</li>}
							{Object.values(baselineBudget).some(v => v % 5 !== 0) && <li>Each skill budget must be a multiple of 5</li>}
							{Object.entries(validations).filter(([, v]) => !v.isValid).map(([k, v]) => (
								<li key={k}>{k}: {v.errors.join(', ')}</li>
							))}
						</ul>
					</AlertDescription>
				</Alert>
			)}

			{/* Action Buttons */}
			<div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
<Button variant="outline" onClick={() => onSuccess?.()} disabled={submitting}>
							Cancel
						</Button>
				<Button 
					onClick={handleSubmit} 
					disabled={submitting || !isAllValid()}
					className="bg-blue-600 hover:bg-blue-700"
				>
					{submitting ? (
						<>
<Loader2 className="w-4 h-4 animate-spin mr-2" />
									Saving...
						</>
					) : (
						<>
							<Save className="w-4 h-4 mr-2" />
							{isEdit ? 'Update' : 'Create New'}
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
							Confirm Track Deactivation
						</DialogTitle>
						<DialogDescription>
							You are about to deactivate track <strong>{initialTrack?.name}</strong>. This action cannot be undone.
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
									<p className="font-medium mb-2">Some active learners:</p>
									<ul className="space-y-1">
										{deactivateWarning.activeLearnersPreview.map(u => (
											<li key={u.id} className="text-gray-600">
												{u.name} ({u.email}) - {u.progress}% completed
											</li>
										))}
									</ul>
								</div>
							)}
						</div>
					)}
					
					<DialogFooter className="flex-col-reverse sm:flex-row gap-3">
<Button variant="outline" onClick={() => setShowDeactivateConfirm(false)}>
								Cancel
							</Button>
						<Button variant="destructive" onClick={confirmDeactivate} disabled={submitting}>
							{submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Confirm Deactivate'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}