// Multi-Select Question Component
// Schema: [stem, options, answer, explanation, wD, wC, wT, wG, remD, remC, remT, remG]
// Answer is a pipe-separated list of zero-based correct option indices (e.g. "0|2")

import { useCallback } from 'react';
import { Checkbox } from '@/shadcn/component/ui/checkbox';
import { Label } from '@/shadcn/component/ui/label';
import { cn } from '@/shadcn/lib/util';
import { Check, X } from 'lucide-react';

interface MultiSelectQuestionProps {
	data: [
		stem: string,
		options: string,
		answer: string,
		explanation: string,
		wD: number, wC: number, wT: number, wG: number,
		remD: number, remC: number, remT: number, remG: number
	];
	questionNumber: number;
	totalQuestions: number;
	userAnswer: string | null;
	onAnswerChange: (answer: string) => void;
	isSubmitted: boolean;
	isCorrect?: boolean;
	correctAnswer?: string;
	explanation?: string;
	revealAnswer?: boolean;
}

function parseIndices(value: string | null): number[] {
	if (!value) return [];
	return value
		.split('|')
		.map(s => parseInt(s.trim(), 10))
		.filter(n => !isNaN(n));
}

export function MultiSelectQuestion({
	data,
	questionNumber,
	totalQuestions,
	userAnswer,
	onAnswerChange,
	isSubmitted,
	isCorrect,
	correctAnswer: explicitCorrectAnswer,
	explanation,
	revealAnswer = true,
}: MultiSelectQuestionProps) {
	const [stem, optionsStr, dataAnswerStr, expl] = data;
	const answerStr = explicitCorrectAnswer ?? dataAnswerStr;
	const options = optionsStr.split('|');
	const correctIndices = parseIndices(answerStr);
	const selectedIndices = parseIndices(userAnswer);

	const toggleOption = useCallback((index: number) => {
		const selected = new Set(selectedIndices);
		if (selected.has(index)) {
			selected.delete(index);
		} else {
			selected.add(index);
		}
		onAnswerChange([...selected].sort((a, b) => a - b).join('|'));
	}, [selectedIndices, onAnswerChange]);

	return (
		<div className="space-y-6 rounded-3xl border border-border/80 bg-card p-5 shadow-elevation-1 sm:p-7">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h3 className="font-display text-lg font-bold text-foreground">
					Question {questionNumber} / {totalQuestions} · <span className="text-muted-foreground font-normal">Multi-Select</span>
				</h3>
				{isSubmitted && (
					<div className={cn(
						'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border',
						isCorrect ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' : 'bg-destructive/10 text-destructive border-destructive/20'
					)}>
						{isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
						{isCorrect ? 'Correct' : 'Incorrect'}
					</div>
				)}
			</div>

			{/* Scenario */}
			<div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 backdrop-blur-xs">
				<p className="font-bold text-xs uppercase tracking-wider text-primary mb-1.5">Scenario</p>
				<p className="font-display text-base font-semibold text-foreground sm:text-lg leading-relaxed">{stem}</p>
				<p className="text-xs font-semibold text-muted-foreground mt-2">Select all options that apply.</p>
			</div>

			{/* Options */}
			<div className="space-y-3" role="group" aria-label="Select all correct options">
				{options.map((option, index) => {
					const isSelected = selectedIndices.includes(index);
					const isCorrectOption = correctIndices.includes(index);
					const showResult = isSubmitted && (isSelected || (revealAnswer && isCorrectOption));

					return (
						<Label
							key={index}
							className={cn(
								'relative flex items-start gap-3.5 rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer',
								'hover:bg-muted/50',
								isSubmitted
									? revealAnswer && isCorrectOption
										? 'border-emerald-500 bg-emerald-500/10'
										: isSelected
										? 'border-rose-500 bg-rose-500/10'
										: 'border-border/60 opacity-50'
									: isSelected
									? 'border-primary bg-primary/10 shadow-xs'
									: 'border-border bg-card'
							)}
						>
							<Checkbox
								checked={isSelected}
								disabled={isSubmitted}
								onCheckedChange={() => toggleOption(index)}
								id={`ms-option-${questionNumber}-${index}`}
								className={cn(
									'mt-0.5 focus-visible:ring-2 focus-visible:ring-primary',
									showResult && isCorrectOption && 'text-emerald-600 border-emerald-500',
									showResult && isSelected && !isCorrectOption && 'text-rose-600 border-rose-500'
								)}
							/>
							<span className={cn(
								'flex min-w-0 flex-1 items-start gap-3 text-foreground',
								showResult && revealAnswer && isCorrectOption && 'font-medium',
								showResult && isSelected && !isCorrectOption && 'line-through text-rose-500'
							)}>
								<span className={cn(
									'flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border text-xs font-bold transition-colors',
									isSubmitted
										? revealAnswer && isCorrectOption
											? 'bg-emerald-500 border-emerald-500 text-white'
											: isSelected
											? 'bg-rose-500 border-rose-500 text-white'
											: 'border-border text-muted-foreground'
										: isSelected
										? 'border-primary text-primary bg-primary/15'
										: 'border-border text-muted-foreground'
								)}>
									{String.fromCharCode(65 + index)}
								</span>
								<span className="min-w-0 text-sm sm:text-base leading-relaxed pt-0.5">{option}</span>
							</span>
							{showResult && revealAnswer && isCorrectOption && (
								<Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
							)}
							{showResult && isSelected && !isCorrectOption && (
								<X className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
							)}
						</Label>
					);
				})}
			</div>

			{/* Explanation */}
			{isSubmitted && revealAnswer && (
				<div className="p-4 sm:p-5 rounded-2xl bg-muted/60 border border-border">
					<div className="flex items-start gap-3">
						<div className={cn(
							'w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0',
							isCorrect ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-destructive/15 text-destructive'
						)}>
							{isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
						</div>
						<div className="flex-1">
							<p className="font-bold text-sm text-foreground">Explanation</p>
							<p className="mt-1 text-sm font-normal leading-relaxed text-muted-foreground">{explanation || expl}</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
