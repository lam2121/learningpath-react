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
	explanation?: string;
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
	explanation
}: MultiSelectQuestionProps) {
	const [stem, optionsStr, answerStr, expl] = data;
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
		<div className="space-y-6 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold text-gray-900">
					Question {questionNumber} / {totalQuestions} · <span className="text-gray-500 font-normal">Multi-Select</span>
				</h3>
				{isSubmitted && (
					<div className={cn(
						'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1',
						isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
					)}>
						{isCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
						{isCorrect ? 'Correct' : 'Incorrect'}
					</div>
				)}
			</div>

			{/* Scenario */}
			<div className="p-5 rounded-xl bg-purple-50 border border-purple-100">
				<p className="font-medium text-purple-900 mb-2">Scenario:</p>
				<p className="text-gray-800 text-lg">{stem}</p>
				<p className="text-sm text-purple-700 mt-2">Select ALL that apply.</p>
			</div>

			{/* Options */}
			<div className="space-y-3" role="group" aria-label="Select all correct options">
				{options.map((option, index) => {
					const isSelected = selectedIndices.includes(index);
					const isCorrectOption = correctIndices.includes(index);
					const showResult = isSubmitted && (isSelected || isCorrectOption);

					return (
						<Label
							key={index}
							className={cn(
								'relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer',
								'hover:bg-gray-50',
								isSubmitted
									? isCorrectOption
										? 'border-green-400 bg-green-50'
										: isSelected
										? 'border-red-400 bg-red-50'
										: 'border-gray-200 opacity-60'
									: isSelected
									? 'border-blue-400 bg-blue-50'
									: 'border-gray-200'
							)}
						>
							<Checkbox
								checked={isSelected}
								disabled={isSubmitted}
								onCheckedChange={() => toggleOption(index)}
								id={`ms-option-${questionNumber}-${index}`}
								className={cn(
									'focus-visible:ring-2 focus-visible:ring-blue-500',
									showResult && isCorrectOption && 'text-green-600 border-green-500',
									showResult && isSelected && !isCorrectOption && 'text-red-600 border-red-500'
								)}
							/>
							<span className={cn(
								'flex items-center gap-3 flex-1 text-gray-900',
								showResult && isCorrectOption && 'font-medium',
								showResult && isSelected && !isCorrectOption && 'line-through text-red-500'
							)}>
								<span className={cn(
									'w-7 h-7 flex items-center justify-center rounded-full border-2 font-semibold text-sm',
									isSubmitted
										? isCorrectOption
											? 'bg-green-500 border-green-500 text-white'
											: isSelected
											? 'bg-red-500 border-red-500 text-white'
											: 'border-gray-300 text-gray-400'
										: isSelected
										? 'border-blue-500 text-blue-600 bg-blue-50'
										: 'border-gray-300 text-gray-500'
								)}>
									{String.fromCharCode(65 + index)}
								</span>
								{option}
							</span>
							{showResult && isCorrectOption && (
								<Check className="w-5 h-5 text-green-500" />
							)}
							{showResult && isSelected && !isCorrectOption && (
								<X className="w-5 h-5 text-red-500" />
							)}
						</Label>
					);
				})}
			</div>

			{/* Explanation */}
			{isSubmitted && (
				<div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
					<div className="flex items-start gap-3">
						<div className={cn(
							'w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0',
							isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
						)}>
							{isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
						</div>
						<div className="flex-1">
							<p className="font-medium text-gray-900">Explanation:</p>
							<p className="text-sm text-gray-600 mt-1">{explanation || expl}</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
