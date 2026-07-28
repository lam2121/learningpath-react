import { useState } from 'react';
import { cn } from '@/shadcn/lib/util';
import { Check, AlertTriangle, BookOpen, RotateCcw, Target, Loader2, Lock } from 'lucide-react';
import { Button } from '@/shadcn/component/ui/button';
import { Progress } from '@/shadcn/component/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shadcn/component/ui/dialog';
import type { QuizResult } from '../type/Quiz';

interface FailureRoutingModalProps {
	isOpen: boolean;
	onClose: () => void;
	onRetry: () => void;
	onReviewTheory: () => void;
	result: QuizResult;
	quizType: 'lesson' | 'topic' | 'final';
	failureCount: number;
	maxRetriesBeforeTheory?: number;
}

const skillLabels: Record<string, string> = {
	D: 'Văn bản kỹ thuật (D)',
	C: 'Giao tiếp (C)',
	T: 'Xử lý rủi ro (T)',
	G: 'Thương mại (G)'
};

const skillColors: Record<string, string> = {
	D: 'bg-blue-100 text-blue-700 border-blue-200',
	C: 'bg-green-100 text-green-700 border-green-200',
	T: 'bg-orange-100 text-orange-700 border-orange-200',
	G: 'bg-purple-100 text-purple-700 border-purple-200'
};

export function FailureRoutingModal({
	isOpen,
	onClose,
	onRetry,
	onReviewTheory,
	result,
	quizType,
	failureCount,
	maxRetriesBeforeTheory = 3
}: FailureRoutingModalProps) {
	const [submittingReview, setSubmittingReview] = useState(false);
	const [submittingRetry, setSubmittingRetry] = useState(false);
	
	const passed = result.passed;
	const isLessonQuiz = quizType === 'lesson';
	const isFinalTest = quizType === 'final';
	const shouldLockRetry = isLessonQuiz && failureCount >= maxRetriesBeforeTheory && !passed;
	
	// Find weakest skills
	const weakSkills = Object.entries(result.skillBreakdown)
		.filter(([, data]) => data.total > 0 && (data.score / data.total) < 0.7)
		.sort((a, b) => (a[1].score / a[1].total) - (b[1].score / b[1].total))
		.slice(0, 2);

	const handleReviewTheory = async () => {
		setSubmittingReview(true);
		try {
			await onReviewTheory();
		} finally {
			setSubmittingReview(false);
		}
	};

	const handleRetry = async () => {
		setSubmittingRetry(true);
		try {
			await onRetry();
		} finally {
			setSubmittingRetry(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-lg sm:max-w-2xl">
				<DialogHeader className="text-center">
					<div className={cn(
						'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
						passed ? 'bg-green-100' : 'bg-red-100'
					)}>
						{passed ? (
							<Check className="w-8 h-8 text-green-600" />
						) : (
							<AlertTriangle className="w-8 h-8 text-red-600" />
						)}
					</div>
					<DialogTitle className="text-xl font-bold">
						{passed ? 'Chúc mừng! Bạn đã đạt' : 'Chưa đạt điểm yêu cầu'}
					</DialogTitle>
					<DialogDescription className="text-gray-600">
						{passed 
							? `Điểm: ${result.percentage}% (Yêu cầu ${isFinalTest ? '80%' : '70%'})` 
							: `Điểm: ${result.percentage}% · Cần ${isFinalTest ? '80%' : '70%'} để qua`
						}
					</DialogDescription>
				</DialogHeader>

				{/* Score Breakdown */}
				<div className="space-y-4 mb-6 p-4 rounded-xl bg-gray-50">
					<h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
						<Target className="w-4 h-4 text-blue-600" />
						Phân tích theo kỹ năng
					</h4>
					<div className="space-y-3">
						{(['D', 'C', 'T', 'G'] as const).map(skill => {
							const data = result.skillBreakdown[skill];
							const pct = data.total > 0 ? Math.round((data.score / data.total) * 100) : 0;
							return (
								<div key={skill} className={cn(
									'p-3 rounded-lg border flex items-center justify-between',
									skillColors[skill]
								)}>
									<div className="flex items-center gap-3">
										<span className={cn(
											'px-2 py-0.5 text-xs font-medium rounded',
											skillColors[skill]
										)}>
											{skillLabels[skill]}
										</span>
									</div>
									<div className="flex items-center gap-3 w-48">
										<Progress value={pct} className="h-2 flex-1" />
										<span className="text-sm font-medium w-12 text-right">{pct}%</span>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* AI Recommendation */}
				<div className="p-4 rounded-xl bg-blue-50 border border-blue-100 mb-6">
					<h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
						<Target className="w-4 h-4" />
						Khuyến nghị từ AI:
					</h4>
					<p className="text-blue-700 text-sm">{result.aiSummary}</p>
				</div>

				{/* Weak Skills Focus */}
				{weakSkills.length > 0 && !passed && (
					<div className="p-4 rounded-xl bg-amber-50 border border-amber-100 mb-6">
						<h4 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
							<AlertTriangle className="w-4 h-4" />
							Kỹ năng cần tập trung ôn lại:
						</h4>
						<div className="flex flex-wrap gap-2">
							{weakSkills.map(([skill]) => (
								<span key={skill} className={cn(
									'px-2 py-0.5 text-xs font-medium rounded',
									skillColors[skill]
								)}>
									{skillLabels[skill]}
								</span>
							))}
						</div>
					</div>
				)}

				{/* Final Test Specific - Failure Routing */}
				{isFinalTest && !passed && (
					<div className="p-4 rounded-xl bg-red-50 border border-red-100 mb-6">
						<h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
							<AlertTriangle className="w-4 h-4" />
							Final Test - Quy trình xử lý
						</h4>
						<ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
							<li>Bạn cần ôn lại ít nhất 2 bài học yếu nhất trước khi thi lại.</li>
							<li>Hệ thống sẽ khóa nút "Thi lại" cho đến khi bạn đọc xong lý thuyết.</li>
							<li>Có tối đa 3 lần yêu cầu Re-path (tái cấu trúc lộ trình).</li>
						</ul>
					</div>
				)}

				{/* Lesson Quiz Failure - Lock Retry */}
				{isLessonQuiz && shouldLockRetry && (
					<div className="p-4 rounded-xl bg-red-50 border border-red-100 mb-6">
						<h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
							<AlertTriangle className="w-4 h-4" />
							Đã trượt {failureCount} lần - Yêu cầu đọc lại lý thuyết
						</h4>
						<p className="text-red-700 text-sm">
							Theo chính sách Anti-Farming, bạn phải đọc lại phần lý thuyết của bài học này 
							trước khi được phép làm lại quiz lần thứ {failureCount + 1}.
						</p>
					</div>
				)}

				<DialogFooter className="flex-col gap-3">
					{!passed && (
						<Button
							variant="default"
							className="w-full bg-blue-600 hover:bg-blue-700"
							onClick={handleReviewTheory}
							disabled={submittingReview}
						>
							<BookOpen className="w-4 h-4 mr-2" />
							{submittingReview ? 'Đang mở...' : 'Đọc lại lý thuyết'}
						</Button>
					)}
					
					<div className="flex gap-3 w-full">
						{!passed && (
							<Button
								variant={shouldLockRetry ? 'outline' : 'default'}
								className="flex-1"
								onClick={handleRetry}
								disabled={shouldLockRetry || submittingRetry}
							>
								{shouldLockRetry ? (
									<>
										<Lock className="w-4 h-4 mr-2" />
										Khóa - Cần đọc lý thuyết
									</>
								) : submittingRetry ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin mr-2" />
										Đang tải...
									</>
								) : (
									<>
										<RotateCcw className="w-4 h-4 mr-2" />
										Làm lại quiz
									</>
								)}
							</Button>
						)}
						
						<Button
							variant="outline"
							className="flex-1"
							onClick={onClose}
						>
							Đóng
						</Button>
					</div>
					
					{passed && (
						<Button className="w-full" onClick={onClose}>
							Tiếp tục
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}