import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/shadcn/lib/util';
import { Slider } from '@/shadcn/component/ui/slider';
import { Label } from '@/shadcn/component/ui/label';
import { Alert, AlertDescription } from '@/shadcn/component/ui/alert';
import { AlertCircle } from 'lucide-react';
import { validateBudget, type BudgetVector, type BudgetValidationResult } from '../api/adminApi';

interface BudgetSliderProps {
	value: number;
	onChange: (value: number) => void;
	skillKey: 'D' | 'C' | 'T' | 'G';
	allValues: BudgetVector;
	validation: BudgetValidationResult | null;
	disabled?: boolean;
}

const skillInfo: Record<'D' | 'C' | 'T' | 'G', { label: string; color: string; bgColor: string; icon: string }> = {
	D: { label: 'Document (D)', color: 'bg-blue-500', bgColor: 'bg-blue-50', icon: '📄' },
	C: { label: 'Communication (C)', color: 'bg-green-500', bgColor: 'bg-green-50', icon: '💬' },
	T: { label: 'Troubleshooting (T)', color: 'bg-orange-500', bgColor: 'bg-orange-50', icon: '⚠️' },
	G: { label: 'Growth/Economics (G)', color: 'bg-purple-500', bgColor: 'bg-purple-50', icon: '💰' }
};

export function BudgetSlider({ value, onChange, skillKey, allValues, validation, disabled }: BudgetSliderProps) {
	const info = skillInfo[skillKey];
	const sum = allValues.D + allValues.C + allValues.T + allValues.G;
	const isValid = validation?.isValid ?? true;
	const hasError = !isValid && (validation?.errors.length ?? 0) > 0;
	
	return (
		<div className="space-y-3 p-4 rounded-xl border bg-white" style={{ borderColor: hasError ? 'rgb(239,68,68)' : 'rgb(226,232,240)' }}>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-lg">{info.icon}</span>
					<Label className="font-medium text-gray-900">{info.label}</Label>
				</div>
				<div className={cn(
					'px-3 py-1 rounded-full text-sm font-bold tabular-nums',
					hasError ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
				)}>
					{value}%
				</div>
			</div>
			
			<div className="relative">
				<Slider
					value={[value]}
					onValueChange={([v]) => onChange(v)}
					max={100}
					step={5}
					disabled={disabled}
					className={cn(
						hasError && 'bg-red-200'
					)}
				/>
				
				{hasError && (
					<div className="mt-2 text-xs text-red-600">
						Total must = 100% (currently: {sum}%)
					</div>
				)}
			</div>
		</div>
	);
}

interface BudgetSlidersGroupProps {
	initialBudgets?: {
		basic: BudgetVector;
		intermediate: BudgetVector;
		advanced: BudgetVector;
	};
	onChange: (milestone: string, budget: BudgetVector) => void;
	disabled?: boolean;
}

const milestoneLabels = ['Basic', 'Intermediate', 'Advanced'];
const milestoneKeys = ['basic', 'intermediate', 'advanced'] as const;

export function BudgetSlidersGroup({ initialBudgets, onChange, disabled }: BudgetSlidersGroupProps) {
	const [budgets, setBudgets] = useState<Record<string, BudgetVector>>({
		basic: initialBudgets?.basic || { D: 25, C: 25, T: 25, G: 25 },
		intermediate: initialBudgets?.intermediate || { D: 25, C: 25, T: 25, G: 25 },
		advanced: initialBudgets?.advanced || { D: 25, C: 25, T: 25, G: 25 }
	});
	
	const [validations, setValidations] = useState<Record<string, BudgetValidationResult>>({});
	const [linkedMode, setLinkedMode] = useState(false);

	useEffect(() => {
		if (initialBudgets) {
			setBudgets({
				basic: initialBudgets.basic,
				intermediate: initialBudgets.intermediate,
				advanced: initialBudgets.advanced
			});
		}
	}, [initialBudgets]);

	const validateAll = useCallback(async () => {
		const results: Record<string, BudgetValidationResult> = {};
		for (const [milestone, budget] of Object.entries(budgets)) {
			results[milestone] = await validateBudget(budget);
		}
		setValidations(results);
	}, [budgets]);

	useEffect(() => {
		validateAll();
	}, [validateAll]);

	const handleChange = (milestone: string, skill: keyof BudgetVector, value: number) => {
		const newBudgets = { ...budgets };
		const currentBudget = { ...newBudgets[milestone] };
		
		if (linkedMode) {
			// Auto-balance other skills proportionally
			const otherSkills = (['D', 'C', 'T', 'G'] as const).filter(s => s !== skill);
			const oldValue = currentBudget[skill];
			const diff = value - oldValue;
			
			// Distribute diff proportionally among other skills
			const totalOther = otherSkills.reduce((sum, s) => sum + currentBudget[s], 0);
			if (totalOther > 0) {
				otherSkills.forEach(s => {
					const proportion = currentBudget[s] / totalOther;
					const adjustment = Math.round(-diff * proportion);
					currentBudget[s] = Math.max(0, Math.min(100, currentBudget[s] + adjustment));
				});
			}
		}
		
		currentBudget[skill] = value;
		newBudgets[milestone] = currentBudget;
		setBudgets(newBudgets);
		onChange(milestone, currentBudget);
	};

	const isAllValid = Object.values(validations).every(v => v.isValid);

	return (
		<div className="space-y-6">
			{/* Linked Mode Toggle */}
			<div className="flex items-center gap-3">
				<label className="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={linkedMode}
						onChange={e => setLinkedMode(e.target.checked)}
						disabled={disabled}
						className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<span className="text-sm text-gray-700">Linked Mode (auto-balances other skills when dragging)</span>
				</label>
			</div>

			{/* Milestone Tabs */}
			<div className="space-y-6">
				{milestoneLabels.map((label, idx) => {
					const milestone = milestoneKeys[idx];
					const budget = budgets[milestone] || { D: 25, C: 25, T: 25, G: 25 };
					const validation = validations[milestone] || null;
					
					return (
						<div key={milestone} className="space-y-4 p-4 rounded-xl border bg-gray-50">
							<h4 className="font-semibold text-gray-900 flex items-center gap-2">
								<span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">{label}</span>
								D/C/T/G Budget
							</h4>
							
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
								{(['D', 'C', 'T', 'G'] as const).map(skill => (
									<BudgetSlider
										key={skill}
										value={budget[skill]}
										onChange={v => handleChange(milestone, skill, v)}
										skillKey={skill}
										allValues={budget}
										validation={validation}
										disabled={disabled}
									/>
								))}
							</div>
						</div>
					);
				})}
			</div>

			{/* Summary */}
			<div className="p-4 rounded-xl bg-white border">
				<h4 className="font-medium text-gray-900 mb-3">Budget Summary</h4>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left text-gray-500 border-b border-gray-100">
								<th className="pb-2">Milestone</th>
								<th className="pb-2 text-center">D</th>
								<th className="pb-2 text-center">C</th>
								<th className="pb-2 text-center">T</th>
								<th className="pb-2 text-center">G</th>
								<th className="pb-2 text-center">Total</th>
								<th className="pb-2 text-center">Status</th>
							</tr>
						</thead>
						<tbody>
							{milestoneKeys.map((milestone, idx) => {
								const budget = budgets[milestone] || { D: 25, C: 25, T: 25, G: 25 };
								const sum = budget.D + budget.C + budget.T + budget.G;
								const validation = validations[milestone];
								return (
									<tr key={milestone} className="border-b border-gray-50">
										<td className="py-2 font-medium">{milestoneLabels[idx]}</td>
										<td className="py-2 text-center text-blue-600">{budget.D}</td>
										<td className="py-2 text-center text-green-600">{budget.C}</td>
										<td className="py-2 text-center text-orange-600">{budget.T}</td>
										<td className="py-2 text-center text-purple-600">{budget.G}</td>
										<td className={cn('py-2 text-center font-bold', sum === 100 ? 'text-green-600' : 'text-red-600')}>{sum}</td>
										<td className="py-2 text-center">
											{validation?.isValid ? (
												<span className="text-green-600 text-xs">✓ Valid</span>
											) : (
												<span className="text-red-600 text-xs">✗ Error</span>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
				
				{!isAllValid && (
					<Alert className="mt-3" variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							{Object.values(validations).filter(v => !v.isValid).length} milestone(s) have budget errors. Cannot save until fixed.
						</AlertDescription>
					</Alert>
				)}
			</div>
		</div>
	);
}