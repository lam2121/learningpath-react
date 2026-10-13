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
	revealAnswer?: boolean;
	correctAnswer?: string;
	explanation?: string;
	isCorrect?: boolean;
}

export function FillBlankQuestion({
	data,
	questionNumber,
	totalQuestions,
	onAnswer,
	isSubmitted = false,
	userAnswer,
	revealAnswer = true,
	correctAnswer: explicitCorrectAnswer,
	explanation: explicitExplanation,
	isCorrect: explicitIsCorrect,
}: FillBlankQuestionProps) {
	const [stem, optionsStr, dataCorrectAnswer, dataExplanation] = data;
	const correctAnswer = explicitCorrectAnswer ?? dataCorrectAnswer;
	const explanation = explicitExplanation ?? dataExplanation;
	const options = optionsStr.split('|');
	const isCorrect = explicitIsCorrect !== undefined ? explicitIsCorrect : userAnswer === correctAnswer;

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
				<p className="text-base leading-relaxed text-gray-900 sm:text-lg dark:text-slate-100">
					<span>{parts[0]}</span>
					<span className="relative">
						{isSubmitted ? (
							isCorrect ? (
								<span className="bg-green-100 text-green-800 px-3 py-1 rounded font-medium border border-green-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700">
									{correctAnswer}
								</span>
							) : (
								revealAnswer ? (
									<>
										<span className="bg-red-100 text-red-800 px-3 py-1 rounded font-medium border border-red-300 line-through dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700">
											{userAnswer || '___'}
										</span>
										<span className="ml-2 bg-green-100 text-green-800 px-3 py-1 rounded font-medium border border-green-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700">
											{correctAnswer}
										</span>
									</>
								) : (
									<span className="bg-red-100 text-red-800 px-3 py-1 rounded font-medium border border-red-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700">
										{userAnswer || '___'}
									</span>
								)
							)
						) : (
							<span className="inline-block min-w-[88px] border-b-2 border-gray-300 bg-gray-100 px-2 text-center sm:min-w-[120px] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">___</span>
						)}
					</span>
					<span>{parts[1]}</span>
				</p>
			);
		}
		return <p className="text-base leading-relaxed text-gray-900 sm:text-lg dark:text-slate-100">{stem}</p>;
	};

	return (
		<div className="space-y-6 rounded-3xl border border-border/80 bg-card p-5 shadow-elevation-1 sm:p-7" data-question-type="fill_blank">
			{/* Question Header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<span className="font-display text-lg font-bold text-foreground">Question {questionNumber} / {totalQuestions}</span>
					<span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">Fill-in-the-blank</span>
				</div>
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

			{/* Question Stem */}
			<div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 backdrop-blur-xs">
				<p className="font-bold text-xs uppercase tracking-wider text-primary mb-1.5">Sentence</p>
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
					const isOptionCorrect = isSubmitted && revealAnswer && option === correctAnswer;
					const isOptionWrong = isSubmitted && isOptionSelected && !isCorrect;

					return (
						<div key={option} className="relative group">
							<Label
								htmlFor={`fill-option-${questionNumber}-${index}`}
								className={cn(
									'flex items-start gap-3.5 rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer',
									'border-border bg-card hover:bg-muted/50',
									isOptionSelected && !isSubmitted && 'border-primary bg-primary/10 shadow-xs',
									isOptionCorrect && 'border-emerald-500 bg-emerald-500/10',
									isOptionWrong && 'border-rose-500 bg-rose-500/10',
									isSubmitted && !isOptionSelected && !isOptionCorrect && 'opacity-50',
									isSubmitted && 'cursor-default',
								)}
							>
								{/* Radio circle — this is all RadioGroupItem should render */}
								<RadioGroupItem
									value={option}
									id={`fill-option-${questionNumber}-${index}`}
									className="mt-0.5 shrink-0"
								/>

								{/* Status icon */}
								<div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
									{isOptionCorrect ? (
										<Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
									) : isOptionWrong ? (
										<X className="w-5 h-5 text-rose-600 dark:text-rose-400" />
									) : null}
								</div>

								<span className="min-w-0 flex-1 text-base font-semibold text-foreground">{option}</span>

								{isOptionCorrect && (
									<span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 sm:ml-auto">
										Correct Answer
									</span>
								)}
							</Label>
						</div>
					);
				})}
			</RadioGroup>

			{/* Explanation */}
			{isSubmitted && revealAnswer && (
				<div className="p-4 rounded-xl bg-gray-50 border border-gray-200 dark:bg-slate-800/80 dark:border-slate-700">
					<div className="flex items-start gap-3">
						<div className={cn(
							'w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0',
							isCorrect ? 'bg-green-100 text-green-600 dark:bg-emerald-950/70 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-rose-950/70 dark:text-rose-400'
						)}>
							{isCorrect ? (
								<Check className="w-5 h-5" />
							) : (
								<X className="w-5 h-5" />
							)}
						</div>
						<div className="flex-1">
							<p className="font-bold text-slate-950 dark:text-white">Explanation:</p>
							<p className="mt-1 text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100">{explanation}</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
