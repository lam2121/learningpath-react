import { cn } from '@/shadcn/lib/util';
import { Check, X, Bookmark, ChevronDown, Flag, Clock, Brain, BookOpen, RotateCcw } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shadcn/component/ui/accordion';
import { Badge } from '@/shadcn/component/ui/badge';
import { Button } from '@/shadcn/component/ui/button';
import type { QuizResult } from '../type/Quiz';

interface QuizResultAccordionProps {
	result: QuizResult;
	onBookmark?: (questionIndex: number) => void;
	onRetry?: () => void;
	onReviewTheory?: () => void;
}

const skillLabels: Record<string, string> = {
	D: 'Document (D)',
	C: 'Communication (C)',
	T: 'Troubleshooting (T)',
	G: 'Growth/Economics (G)'
};

const skillColors: Record<string, string> = {
	D: 'bg-blue-100 text-blue-700',
	C: 'bg-green-100 text-green-700',
	T: 'bg-orange-100 text-orange-700',
	G: 'bg-purple-100 text-purple-700'
};

export function QuizResultAccordion({
	result,
	onBookmark,
	onRetry,
	onReviewTheory
}: QuizResultAccordionProps) {
	const passed = result.passed;
	const scorePercent = result.percentage;

	const getSkillVectorLabel = (vector: [number, number, number, number]) => {
		const skills = ['D', 'C', 'T', 'G'];
		const idx = vector.indexOf(10);
		return idx >= 0 ? skills[idx] : '-';
	};

	return (
		<div className="space-y-6 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
			{/* Result Header */}
			<div className="text-center space-y-4">
				<div className={cn(
					'inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold',
					passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
				)}>
{passed ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
						{passed ? 'PASSED' : 'FAILED'}
				</div>
				
				<div className="text-4xl font-bold text-gray-900">
					{Math.round(scorePercent)}%
				</div>
				
				<p className="text-gray-600">
					Score: {result.score.toFixed(1)} / {result.maxScore} · {result.type === 'final' ? 'Final Test' : result.type === 'topic' ? 'Topic Quiz' : 'Lesson Quiz'}
				</p>

				{/* Skill Breakdown */}
				<div className="grid grid-cols-4 gap-3 pt-4 border-t border-gray-100">
					{(['D', 'C', 'T', 'G'] as const).map(skill => {
						const data = result.skillBreakdown[skill];
						const pct = data.total > 0 ? Math.round((data.score / data.total) * 100) : 0;
						return (
							<div key={skill} className="text-center p-3 rounded-xl bg-gray-50">
								<div className={cn('text-2xl font-bold', skillColors[skill].replace('bg-', 'text-').replace('100', '600').replace('700', '700'))}>
									{pct}%
								</div>
								<div className="text-xs text-gray-500">{skillLabels[skill]}</div>
								<div className="text-xs text-gray-400 mt-1">{data.score}/{data.total}</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* AI Summary */}
			<div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
				<div className="flex items-start gap-3">
					<div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
						<Brain className="w-4 h-4 text-blue-600" />
					</div>
					<div className="flex-1">
						<p className="font-medium text-blue-900">AI Feedback:</p>
						<p className="text-blue-700 text-sm mt-1">{result.aiSummary}</p>
					</div>
				</div>
			</div>

			{/* Question Accordion List */}
			<div className="space-y-3">
				<h3 className="text-lg font-semibold text-gray-900">Question Details</h3>
				<Accordion type="multiple" className="space-y-2">
					{result.questionResults.map((qr) => (
						<AccordionItem key={qr.index} value={String(qr.index)}>
							<AccordionTrigger className={cn(
								'flex items-center gap-3 p-4 text-left',
								qr.isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
							)}>
								{/* Question Number & Status */}
								<div className={cn(
									'w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold flex-shrink-0',
									qr.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
								)}>
									{qr.isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
								</div>
								
								{/* Question Text */}
								<div className="flex-1 min-w-0">
<p className="font-medium text-gray-900 truncate">
									Question {qr.index + 1}: {qr.questionText}
								</p>
									<div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
										<Badge variant="outline" className={skillColors[getSkillVectorLabel(qr.skillVector)]}>
											{getSkillVectorLabel(qr.skillVector)}
										</Badge>
										<Clock className="w-3 h-3" />
										{qr.timeSpentSeconds}s
										{qr.confidenceFlag !== 'confident' && (
											<Flag className="w-3 h-3 text-amber-500" />
										)}
									</div>
								</div>

								{/* Bookmark Button */}
								{onBookmark && (
									<Button
										variant="ghost"
										size="icon"
										onClick={() => onBookmark(qr.index)}
										className="h-8 w-8 text-gray-400 hover:text-amber-500"
										aria-label="Bookmark for Review"
									>
										<Bookmark className="w-4 h-4" />
									</Button>
								)}

								<ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
							</AccordionTrigger>
							
							<AccordionContent className="p-4 space-y-4">
								<div className="grid gap-4">
									{/* User Answer vs Correct Answer */}
									<div className="p-4 rounded-xl bg-gray-50">
										<h4 className="text-sm font-medium text-gray-600 mb-2">Your Answer:</h4>
										<p className={cn(
											'font-mono text-base',
											qr.isCorrect ? 'text-green-700' : 'text-red-700'
										)}>
											{qr.userAnswer || '(Not answered)'}
										</p>
									</div>
									
									{!qr.isCorrect && (
										<div className="p-4 rounded-xl bg-green-50">
											<h4 className="text-sm font-medium text-gray-600 mb-2">Correct Answer:</h4>
											<p className="font-mono text-base text-green-700">
												{qr.correctAnswer}
											</p>
										</div>
									)}

									{/* Explanation */}
									<div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
<h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
									<Brain className="w-4 h-4" />
									Explanation:
								</h4>
										<p className="text-blue-700 text-sm leading-relaxed">{qr.explanation}</p>
									</div>

									{/* Confidence Flag */}
									{qr.confidenceFlag !== 'confident' && (
										<div className="p-3 rounded-lg bg-amber-50 border border-amber-100 flex items-center gap-2">
											<Flag className="w-4 h-4 text-amber-600" />
<span className="text-sm text-amber-800">
										{qr.confidenceFlag === 'warning' 
											? '⚠️ This answer is correct but shows signs of guessing/referring to materials (time or lack of focus). Only counted at 50% weight.'
											: '❌ This answer is incorrect.'
										}
									</span>
										</div>
									)}
								</div>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>

			{/* Action Buttons */}
			<div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
				{onReviewTheory && !passed && (
<Button 
							variant="outline" 
							className="flex-1"
							onClick={onReviewTheory}
						>
							<BookOpen className="w-4 h-4 mr-2" />
							Review Theory Again
						</Button>
				)}
				{onRetry && !passed && (
<Button 
							className="flex-1 bg-orange-600 hover:bg-orange-700"
							onClick={onRetry}
						>
							<RotateCcw className="w-4 h-4 mr-2" />
							Retake Quiz
						</Button>
				)}
				{passed && onRetry && (
<Button variant="outline" className="flex-1" onClick={onRetry}>
							Retake to Increase Score
						</Button>
				)}
			</div>
		</div>
	);
}