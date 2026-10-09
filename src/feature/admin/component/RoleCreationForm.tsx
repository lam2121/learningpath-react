import { useState, useCallback } from 'react';
import { Button } from '@/shadcn/component/ui/button';
import { Input } from '@/shadcn/component/ui/input';
import { Textarea } from '@/shadcn/component/ui/textarea';
import { Label } from '@/shadcn/component/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/shadcn/component/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shadcn/component/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shadcn/component/ui/dialog';
import { AlertCircle, AlertTriangle, Loader2, Eye, Save, Trash2, RotateCcw } from 'lucide-react';
import { BudgetSlidersGroup } from './BudgetSlider';
import { AiPreviewModal } from './AiPreviewModal';
import { type CareerTrack, type BudgetVector, type RoleSkillDefinitions, DEFAULT_BASELINE } from '../api/adminApi';
import { createTrack, updateTrack, deactivateTrack, activateTrack, getDeactivationWarning } from '../api/adminApi';

/** "a", "a and b", "a, b and c" — reads as prose inside a sentence. */
function joinList(parts: Array<string | null>): string {
	const items = parts.filter((part): part is string => Boolean(part));
	if (items.length <= 1) return items[0] ?? '';
	return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

type ImpactTab = 'basic' | 'budget' | 'seed' | 'skills';

/**
 * Per-tab notice explaining what editing these fields does to a track that is
 * already in use.
 *
 * The facts behind the copy, so it doesn't drift:
 *  - Saving never deletes anything. `update_role` assigns columns and commits;
 *    no content is regenerated and nothing is marked stale.
 *  - Lesson theory/quiz (C1/C2) are generated LAZILY, per lesson, the first time
 *    anyone studies it. `name`, `job_description` and the skill DESCRIPTIONS are
 *    read at that moment, so editing them changes lessons nobody has opened yet
 *    while already-generated lessons keep their old text.
 *  - `baseline` only takes effect on a course-outline (B1) regeneration, and
 *    `seed_tier_*` only on placement (A) / outline (B1) regeneration.
 *  - `example_questions` never reach any prompt; they are learner-facing only.
 */
function TabImpactNotice({ tab, track }: { tab: ImpactTab; track?: CareerTrack }) {
	// Nothing exists to disturb while creating.
	if (!track) return null;

	const questions = track.placementQuestionsCount ?? 0;
	const topics = track.topicsCount ?? 0;
	const lessons = track.lessonsCount ?? 0;
	const learners = track.activeLearnerCount ?? 0;
	const hasContent = questions > 0 || topics > 0 || lessons > 0;

	if (!hasContent) {
		return (
			<Alert variant="default" className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200">
				<AlertCircle className="h-4 w-4" />
				<AlertTitle>Nothing generated yet</AlertTitle>
				<AlertDescription>
					<p>
						Nothing has been generated for this track yet, so you can edit freely — these
						values are sent to the AI the first time you generate content.
					</p>
				</AlertDescription>
			</Alert>
		);
	}

	const existing = joinList([
		questions > 0 ? `${questions} placement question${questions === 1 ? '' : 's'}` : null,
		topics > 0 ? `${topics} topic${topics === 1 ? '' : 's'}` : null,
		lessons > 0 ? `${lessons} lesson${lessons === 1 ? '' : 's'}` : null,
	]);

	const learnerNote =
		learners > 0
			? ` ${learners} learner${learners === 1 ? ' is' : 's are'} currently enrolled, so regenerating instead would require resetting them first.`
			: '';

	// basic + skills: read at lazy per-lesson generation time -> live content drift.
	if (tab === 'basic' || tab === 'skills') {
		const tabNote =
			tab === 'basic'
				? ' The job description is also shown to learners on the role-selection screen straight away.'
				: ' Example questions are the exception — they appear on the role-selection screen and are never sent to the AI, so editing them is always safe.';
		return (
			<Alert variant="default" className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200">
				<AlertTriangle className="h-4 w-4" />
				<AlertTitle>Existing content won't be updated</AlertTitle>
				<AlertDescription>
					<p>
						{`${existing} already exist for this track and will not be updated when you save. ` +
							'Lesson theory and quizzes are written the first time a learner opens each lesson, ' +
							'so changes here apply only to lessons nobody has studied yet, which means this track ' +
							'will mix content written from the old wording with content written from the new.' +
							learnerNote +
							tabNote}
					</p>
				</AlertDescription>
			</Alert>
		);
	}

	if (tab === 'budget') {
		return (
			<Alert variant="default" className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200">
				<AlertTriangle className="h-4 w-4" />
				<AlertTitle>Applies on the next course regeneration</AlertTitle>
				<AlertDescription>
					<p>
						{'The D/C/T/G split only takes effect when you regenerate the course outline, where ' +
							`it decides how many of the 20 topics target each skill; the existing ${existing} ` +
							'keep their current distribution. It does not change placement scoring, a ' +
							"learner's level or an existing roadmap, but it does immediately change the target " +
							"bars shown on every learner's placement-result chart." +
							learnerNote}
					</p>
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<Alert variant="default" className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200">
			<AlertTriangle className="h-4 w-4" />
			<AlertTitle>Applies on the next regeneration</AlertTitle>
			<AlertDescription>
				<p>
					{'Seed vocabulary is used only when generating placement questions and the topic ' +
						`outline, so the existing ${existing} are not updated and saving changes nothing ` +
						'until you regenerate. Seeds never reach lesson theory or quizzes.' +
						learnerNote}
				</p>
			</AlertDescription>
		</Alert>
	);
}

interface RoleCreationFormProps {
	initialTrack?: CareerTrack;
	onSuccess?: (track?: CareerTrack) => void;
}

function getApiErrorMessage(error: unknown, fallback: string) {
	const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
	return typeof detail === 'string' ? detail : fallback;
}

const DEFAULT_SKILL_DEFINITIONS: RoleSkillDefinitions = {
	D_doc: {
		description: 'Ability to read and write clear, concise, and structured technical documentation.',
		example_questions: [],
	},
	C_comm: {
		description: 'Effective verbal and written communication in professional IT contexts.',
		example_questions: [],
	},
	T_trouble: {
		description: 'Skills in identifying, analyzing, and resolving technical issues.',
		example_questions: [],
	},
	G_custom: {
		description: 'Specific domain knowledge and expertise required for this role.',
		example_questions: [],
	},
};

function getInitialDesc(val: string | Record<string, string> | undefined, fallback: string): string {
	if (!val) return fallback;
	if (typeof val === 'object') {
		return val.en || Object.values(val)[0] || fallback;
	}
	return String(val);
}

function buildInitialSkillDefinitions(initialTrack?: CareerTrack): RoleSkillDefinitions {
	const defs = initialTrack?.skillDefinitions;
	return {
		D_doc: {
			description: getInitialDesc(defs?.D_doc?.description, DEFAULT_SKILL_DEFINITIONS.D_doc.description as string),
			example_questions: defs?.D_doc?.example_questions ?? [],
		},
		C_comm: {
			description: getInitialDesc(defs?.C_comm?.description, DEFAULT_SKILL_DEFINITIONS.C_comm.description as string),
			example_questions: defs?.C_comm?.example_questions ?? [],
		},
		T_trouble: {
			description: getInitialDesc(defs?.T_trouble?.description, DEFAULT_SKILL_DEFINITIONS.T_trouble.description as string),
			example_questions: defs?.T_trouble?.example_questions ?? [],
		},
		G_custom: {
			description: getInitialDesc(defs?.G_custom?.description, DEFAULT_SKILL_DEFINITIONS.G_custom.description as string),
			example_questions: defs?.G_custom?.example_questions ?? [],
		},
	};
}

export function RoleCreationForm({ initialTrack, onSuccess }: RoleCreationFormProps) {
	const isEdit = !!initialTrack;
	const [formData, setFormData] = useState({
		name: initialTrack?.name || '',
		jobDescription: initialTrack?.jobDescription || '',
		seedTier1: initialTrack?.seedTier1 || '',
		seedTier2: initialTrack?.seedTier2 || '',
	});
	const [skillDefinitions, setSkillDefinitions] = useState<RoleSkillDefinitions>(() => buildInitialSkillDefinitions(initialTrack));
	
  const [baselineBudget, setBaselineBudget] = useState<BudgetVector>(() => {
    return initialTrack?.baseline ? { ...initialTrack.baseline } : { ...DEFAULT_BASELINE };
  });

  const [validations] = useState<Record<string, { isValid: boolean; errors: string[]; warnings: string[] }>>({});
	const [submitting, setSubmitting] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [previewData, setPreviewData] = useState<{ examples: string[]; warning?: string; error?: string } | null>(null);
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
    if (!formData.seedTier1.trim()) return false;
    if (!formData.seedTier2.trim()) return false;
    if (Object.values(skillDefinitions).some((definition) => !definition.description.trim())) return false;
    
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
				skill_definitions: skillDefinitions,
				seed_tier_1: formData.seedTier1,
				seed_tier_2: formData.seedTier2,
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
		setPreviewData(null);
		try {
			const result = await (await import('../api/adminApi')).previewAiGeneration({
				jobDescription: formData.jobDescription,
				skillDefinitions,
			});
			setPreviewData(result);
		} catch (error) {
			console.error('Preview failed:', error);
			setPreviewData({
				examples: ['Cannot generate preview. Please try again.'],
				error: getApiErrorMessage(
					error,
					'Preview request failed. If the frontend is in dev bypass mode, the UI may look like admin while the backend still rejects the token.'
				),
			});
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
					<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
						{isEdit ? 'Edit Career Track' : 'Create New Career Track'}
					</h2>
					<p className="text-gray-500 dark:text-gray-400 mt-1">
				{isEdit 
							? `Editing: ${initialTrack?.name} (${initialTrack?.activeLearnerCount || 0} learners active)`
							: 'Enter role info, D/C/T/G budget, seeds, and skill definitions before saving.'
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
						<Button variant="outline" className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-950/50" onClick={handleActivate} disabled={submitting}>
							<RotateCcw className="w-4 h-4 mr-2" />
							Reactivate Track
						</Button>
					)}
				</div>
			</div>

			{/* Form Tabs */}
			<Tabs defaultValue="basic" className="space-y-6">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="basic">Basic Info</TabsTrigger>
					<TabsTrigger value="budget">D/C/T/G Budget</TabsTrigger>
					<TabsTrigger value="seed">Seed Content</TabsTrigger>
					<TabsTrigger value="skills">Skill Definitions</TabsTrigger>
				</TabsList>

				{/* Basic Info Tab */}
				<TabsContent value="basic" className="space-y-6 p-4 pt-0">
					<TabImpactNotice tab="basic" track={initialTrack} />
					<div className="space-y-4">
						<div>
							<Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role Name *</Label>
							<Input
								placeholder="e.g., Business Analyst, QA Engineer, DevOps..."
								value={formData.name}
								onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
								className="text-lg"
							/>
						</div>
						
						<div>
							<Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Description *</Label>
							<Textarea
								placeholder="Detailed job description..."
								value={formData.jobDescription}
								onChange={e => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
								rows={12}
								className="resize-none field-sizing-fixed"
							/>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Description will be used to AI generate lesson content related to this role.</p>
						</div>
						
					</div>
				</TabsContent>

				{/* Budget Tab */}
				<TabsContent value="budget" className="space-y-6 p-4 pt-0">
					<TabImpactNotice tab="budget" track={initialTrack} />
        <BudgetSlidersGroup
          initialBudget={baselineBudget}
          onChange={handleBudgetChange}
          disabled={submitting}
        />
				</TabsContent>

				{/* Seed Content Tab */}
				<TabsContent value="seed" className="space-y-6 p-4 pt-0">
					<TabImpactNotice tab="seed" track={initialTrack} />
					<div className="space-y-4">
						<div>
							<Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seed Tier 1 (Basic Vocabulary) *</Label>
							<Textarea
								placeholder="Basic vocabulary, simple sentence structures... (separated by commas)"
								value={formData.seedTier1}
								onChange={e => setFormData(prev => ({ ...prev, seedTier1: e.target.value }))}
								rows={4}
								className="resize-none"
							/>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Used for Basic level lessons (Vocabulary, Grammar, Basic Reading).</p>
						</div>
						
						<div>
							<Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seed Tier 2 (Advanced Terminology) *</Label>
							<Textarea
								placeholder="Advanced terminology, complex structures... (separated by commas)"
								value={formData.seedTier2}
								onChange={e => setFormData(prev => ({ ...prev, seedTier2: e.target.value }))}
								rows={4}
								className="resize-none"
							/>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Used for Intermediate/Advanced level lessons (Troubleshooting, Negotiation, Advanced topics).</p>
						</div>

					</div>
				</TabsContent>

				<TabsContent value="skills" className="space-y-6 p-4 pt-0">
					<TabImpactNotice tab="skills" track={initialTrack} />
					<div className="grid gap-6">
						{([
							['D_doc', 'Documentation (D_doc)'],
							['C_comm', 'Communication (C_comm)'],
							['T_trouble', 'Troubleshooting (T_trouble)'],
							['G_custom', 'Domain / Custom (G_custom)'],
						] as const).map(([skillKey, skillLabel]) => (
							<div key={skillKey} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-4 bg-white dark:bg-gray-900/50">
								<div>
									<h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{skillLabel}</h3>
									<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Role-specific description and optional learner-facing example questions.</p>
								</div>
								<div>
									<Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</Label>
									<Textarea
										placeholder={`Describe the ${skillLabel} skill for this role...`}
										value={typeof skillDefinitions[skillKey].description === 'string'
											? skillDefinitions[skillKey].description
											: ((skillDefinitions[skillKey].description as Record<string, string>)?.en || '')}
										onChange={e => setSkillDefinitions(prev => ({
											...prev,
											[skillKey]: {
												...prev[skillKey],
												description: e.target.value,
											},
										}))}
										rows={3}
										className="resize-none"
									/>
								</div>
								<div className="grid gap-4 md:grid-cols-2">
									{[0, 1].map((index) => (
										<div key={index}>
											<Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Example Question {index + 1}</Label>
										<Input
												placeholder="Optional learner-facing example question"
												value={skillDefinitions[skillKey].example_questions[index] || ''}
												onChange={e => {
													const value = e.target.value
													setSkillDefinitions(prev => {
														const nextQuestions = [...prev[skillKey].example_questions]
														nextQuestions[index] = value
														return {
															...prev,
															[skillKey]: {
																...prev[skillKey],
																example_questions: nextQuestions,
															},
														}
													})
												}}
											/>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</TabsContent>
			</Tabs>

			{/* Validation Summary */}
			{!isAllValid() && (
				<Alert variant="destructive" className="border-red-200 dark:border-red-800">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription className="flex flex-col gap-1">
						<span className="font-medium">Form invalid:</span>
<ul className="list-disc list-inside text-sm space-y-1">
									{!formData.name.trim() && <li>Role name not entered</li>}
									{!formData.jobDescription.trim() && <li>Job description not entered</li>}
								{!formData.seedTier1.trim() && <li>Seed Tier 1 not entered</li>}
								{!formData.seedTier2.trim() && <li>Seed Tier 2 not entered</li>}
								{Object.entries(skillDefinitions).filter(([, value]) => !value.description.trim()).map(([key]) => (
									<li key={key}>{key} description not entered</li>
								))}
								{Math.abs(Object.values(baselineBudget).reduce((a, b) => a + b, 0) - 100) > 0.1 && (
									<li>Total skill budget must equal 20 topics (currently {Math.round(Object.values(baselineBudget).reduce((a, b) => a + b, 0) / 5)})</li>
								)}
								{Object.values(baselineBudget).some(v => v < 10) && (
									<li>Each skill budget must be at least 2 topics (10% minimum)</li>
								)}
							{Object.entries(validations).filter(([, v]) => !v.isValid).map(([k, v]) => (
								<li key={k}>{k}: {v.errors.join(', ')}</li>
							))}
						</ul>
					</AlertDescription>
				</Alert>
			)}

			{/* Action Buttons */}
			<div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
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
						<DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
							<AlertCircle className="h-5 w-5" />
							Confirm Track Deactivation
						</DialogTitle>
						<DialogDescription>
							You are about to deactivate track <strong>{initialTrack?.name}</strong>. This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					
					{deactivateWarning && (
						<div className="space-y-4 py-4">
							<Alert variant={deactivateWarning.hasActiveLearners ? 'default' : 'default'} className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200">
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
											<li key={u.id} className="text-gray-600 dark:text-gray-400">
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
