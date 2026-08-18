// Fill-in-the-blank Question Component
// Schema: [stem, options, answer, explanation, wD, wC, wT, wG, remD, remC, remT, remG]

import { RadioGroup, RadioGroupItem } from '@/shadcn/component/ui/radio-group';
import { Label } from '@/shadcn/component/ui/label';
import { cn } from '@/shadcn/lib/util';
import type { FillBlankQuestionData } from '../type/Quiz';
import { Check, X } from 'lucide-react';

interface FillBlankQuestionProps {
	data: FillBlankQuestionData;
	questionNumber: number;
	totalQuestions: number;
	onAnswer: (answer: string) => void;
	isSubmitted?: boolean;
	userAnswer?: string;
}

export function FillBlankQuestion({
	data,
	questionNumber,
	totalQuestions,
	onAnswer,
	isSubmitted = false,
	userAnswer
}: FillBlankQuestionProps) {
	const [stem, optionsStr, correctAnswer, explanation] = data;
	const options = optionsStr.split('|');
	const isCorrect = userAnswer === correctAnswer;

	const handleSelect = (value: string) => {
		if (!isSubmitted) {
			onAnswer(value);
		}
	};

	// Render stem with highlighted blank
	const renderStem = () => {
		const parts = stem.split('___');
		if (parts.length === 2) {
			return (
				<p className="text-base leading-relaxed text-gray-900 sm:text-lg">
					<span>{parts[0]}</span>
					<span className="relative">
						{isSubmitted ? (
							isCorrect ? (
								<span className="bg-green-100 text-green-800 px-3 py-1 rounded font-medium border border-green-300">
									{correctAnswer}
								</span>
							) : (
								<>
									<span className="bg-red-100 text-red-800 px-3 py-1 rounded font-medium border border-red-300 line-through">
										{userAnswer || '___'}
									</span>
									<span className="ml-2 bg-green-100 text-green-800 px-3 py-1 rounded font-medium border border-green-300">
										{correctAnswer}
									</span>
								</>
							)
						) : (
							<span className="inline-block min-w-[88px] border-b-2 border-gray-300 bg-gray-100 px-2 text-center sm:min-w-[120px]">___</span>
						)}
					</span>
					<span>{parts[1]}</span>
				</p>
			);
		}
		return <p className="text-base leading-relaxed text-gray-900 sm:text-lg">{stem}</p>;
	};

	return (
		<div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6" data-question-type="fill_blank">
			{/* Question Header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-sm font-medium text-gray-500">Question {questionNumber} / {totalQuestions}</span>
					<span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Fill-in-the-blank</span>
				</div>
				{isSubmitted && (
					<div className={cn(
						'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
						isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
					)}>
{isCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
							{isCorrect ? 'Correct' : 'Incorrect'}
					</div>
				)}
			</div>

			{/* Question Stem */}
			<div className="prose prose-sm max-w-none">
				{renderStem()}
			</div>

			{/* Options — RadioGroupItem is the radio circle only; Label wraps the clickable card */}
			<RadioGroup
				value={userAnswer || ''}
				onValueChange={handleSelect}
				disabled={isSubmitted}
				className="space-y-3"
			>
				{options.map((option, index) => {
					const isOptionSelected = userAnswer === option;
					const isOptionCorrect = isSubmitted && option === correctAnswer;
					const isOptionWrong = isSubmitted && isOptionSelected && !isCorrect;

					return (
						<div key={option} className="relative group">
							<Label
								htmlFor={`fill-option-${questionNumber}-${index}`}
								className={cn(
									'flex items-start gap-3 rounded-xl border-2 p-4 transition-all cursor-pointer',
									'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50',
									isOptionSelected && !isSubmitted && 'border-blue-500 bg-blue-50',
									isOptionCorrect && 'border-green-400 bg-green-50',
									isOptionWrong && 'border-red-400 bg-red-50',
									isSubmitted && !isOptionSelected && !isOptionCorrect && 'opacity-60',
									isSubmitted && 'cursor-default',
								)}
							>
								{/* Radio circle — this is all RadioGroupItem should render */}
								<RadioGroupItem
									value={option}
									id={`fill-option-${questionNumber}-${index}`}
									className="shrink-0"
								/>

								{/* Status icon */}
								<div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
									{isOptionCorrect ? (
										<Check className="w-5 h-5 text-green-600" />
									) : isOptionWrong ? (
										<X className="w-5 h-5 text-red-600" />
									) : null}
								</div>

								<span className="min-w-0 flex-1 text-base font-medium text-gray-900">{option}</span>

								{isOptionCorrect && (
<span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 sm:ml-auto">
									Correct Answer
								</span>
								)}
							</Label>
						</div>
					);
				})}
			</RadioGroup>

			{/* Explanation */}
			{isSubmitted && (
				<div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
					<div className="flex items-start gap-3">
						<div className={cn(
							'w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0',
							isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
						)}>
							{isCorrect ? (
								<Check className="w-5 h-5" />
							) : (
								<X className="w-5 h-5" />
							)}
						</div>
						<div className="flex-1">
							<p className="font-medium text-gray-900">Explanation:</p>
							<p className="text-sm text-gray-600 mt-1">{explanation}</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
