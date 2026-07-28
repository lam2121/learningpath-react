// Matching Question Component
// Schema: [prompt, idealResponse, distractors, explanation, wD, wC, wT, wG, remD, remC, remT, remG]

import { RadioGroup, RadioGroupItem } from '@/shadcn/component/ui/radio-group';
import { Label } from '@/shadcn/component/ui/label';
import { cn } from '@/shadcn/lib/util';
import { Check, X } from 'lucide-react';

interface MatchingQuestionProps {
	data: [
		prompt: string,
		idealResponse: string,
		distractors: string,
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

export function MatchingQuestion({
	data,
	questionNumber,
	totalQuestions,
	userAnswer,
	onAnswerChange,
	isSubmitted,
	isCorrect,
	explanation
}: MatchingQuestionProps) {
	const [prompt, idealResponse, distractors, expl] = data;
	const options = [idealResponse, ...distractors.split('|')];
	const correctAnswer = idealResponse;

	return (
		<div className="space-y-6 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold text-gray-900">
					Câu {questionNumber} / {totalQuestions} · <span className="text-gray-500 font-normal">Matching</span>
				</h3>
				{isSubmitted && (
					<div className={cn(
						'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1',
						isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
					)}>
						{isCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
						{isCorrect ? 'Đúng' : 'Sai'}
					</div>
				)}
			</div>

			{/* Client Statement */}
			<div className="p-5 rounded-xl bg-purple-50 border border-purple-100">
				<p className="font-medium text-purple-900 mb-2">💬 Khách hàng / Quản trị nói:</p>
				<p className="text-gray-800 text-lg italic">"{prompt}"</p>
			</div>

			{/* Options */}
			<RadioGroup
				value={userAnswer ?? ''}
				onValueChange={onAnswerChange}
				disabled={isSubmitted}
			>
				<div className="space-y-3" role="radiogroup" aria-label="Chọn phản hồi phù hợp">
					{options.map((option, index) => {
						const isSelected = userAnswer === option;
						const showResult = isSubmitted && (isSelected || option === correctAnswer);

						return (
							<Label
								key={index}
								className={cn(
									'relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer',
									'hover:bg-gray-50',
									isSubmitted
										? option === correctAnswer
											? 'border-green-400 bg-green-50'
											: isSelected
											? 'border-red-400 bg-red-50'
											: 'border-gray-200 opacity-60'
										: isSelected
										? 'border-blue-400 bg-blue-50'
										: 'border-gray-200'
								)}
							>
								<RadioGroupItem
									value={option}
									id={`match-option-${questionNumber}-${index}`}
									className={cn(
										'focus-visible:ring-2 focus-visible:ring-blue-500',
										showResult && option === correctAnswer && 'text-green-600',
										showResult && isSelected && option !== correctAnswer && 'text-red-600'
									)}
								/>
								<span className={cn(
									'flex items-center gap-3 flex-1 text-gray-900',
									showResult && option === correctAnswer && 'font-medium',
									showResult && isSelected && option !== correctAnswer && 'line-through text-red-500'
								)}>
									<span className={cn(
										'w-7 h-7 flex items-center justify-center rounded-full border-2 font-semibold text-sm',
										isSubmitted
											? option === correctAnswer
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
								{showResult && option === correctAnswer && (
									<Check className="w-5 h-5 text-green-500" />
								)}
								{showResult && isSelected && option !== correctAnswer && (
									<X className="w-5 h-5 text-red-500" />
								)}
							</Label>
						)
					})}
				</div>
			</RadioGroup>

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
							<p className="font-medium text-gray-900">Giải thích:</p>
							<p className="text-sm text-gray-600 mt-1">{explanation || expl}</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}