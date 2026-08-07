import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Loader2, Clock, AlertTriangle, ChevronRight, ChevronLeft, WifiOff } from 'lucide-react';
import { Button } from '@/shadcn/component/ui/button';
import { Progress } from '@/shadcn/component/ui/progress';
import { Toaster, toast } from 'sonner';
import { cn } from '@/shadcn/lib/util';
import type { QuizSession, UserAnswerRecord, QuizResult, FillBlankQuestionData, MultiSelectQuestionData, OrderingQuestionData } from '../type/Quiz';
import { fetchQuiz, autoSaveAnswers, submitQuiz, resumeQuiz } from '../api/quizApi';
import { FillBlankQuestion } from './FillBlankQuestion';
import { MultiSelectQuestion } from './MultiSelectQuestion';
import { OrderingQuestion } from './OrderingQuestion';
import { QuizResultAccordion } from './QuizResultAccordion';
import { calculateConfidence } from '../util/implicitConfidence';

interface QuizShellProps {
	type: 'lesson' | 'topic' | 'final';
	targetId: string;
	onComplete?: (result: QuizResult) => void;
}

export function QuizShell({ type, targetId, onComplete }: QuizShellProps) {
	const navigate = useNavigate();
	const [session, setSession] = useState<QuizSession | null>(null);
	const [loading, setLoading] = useState(true);
	const [resuming, setResuming] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<QuizResult | null>(null);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<number, UserAnswerRecord>>({});
	const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
	const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
	const [showResult, setShowResult] = useState(false);
	const questionStartTime = useRef<number>(Date.now());
	const blurCount = useRef<number>(0);
	const lastAutoSave = useRef<Record<number, UserAnswerRecord>>({});
	const sessionIdRef = useRef<string | null>(null);
	const sessionRef = useRef<QuizSession | null>(null);
	const answersRef = useRef<Record<number, UserAnswerRecord>>({});
	const handleSubmitRef = useRef<typeof handleSubmit | null>(null);
	const dotsContainerRef = useRef<HTMLDivElement>(null);

	// Keep sessionIdRef in sync with session
	useEffect(() => {
		sessionIdRef.current = session?.id ?? null;
		sessionRef.current = session;
	}, [session?.id, session]);

	useEffect(() => {
		answersRef.current = answers;
	}, [answers]);

	// Initialize quiz session
	useEffect(() => {
		let mounted = true;
		const initQuiz = async () => {
			try {
				setResuming(true);
				const savedSession = await resumeQuiz(`${type}_${targetId}`);
				if (savedSession && mounted) {
					setSession(savedSession);
					// Restore answers from saved session
					const restoredAnswers: Record<number, UserAnswerRecord> = {};
					for (const [idx, ans] of Object.entries(savedSession.answers)) {
						restoredAnswers[Number(idx)] = ans;
					}
					setAnswers(restoredAnswers);
					setCurrentQuestionIndex(savedSession.currentIndex);
					if (savedSession.timeRemainingSeconds) {
						setTimeRemaining(savedSession.timeRemainingSeconds);
					}
				} else if (mounted) {
					const newSession = await fetchQuiz(type, targetId);
					setSession(newSession);
					if (newSession.timeRemainingSeconds) {
						setTimeRemaining(newSession.timeRemainingSeconds);
					}
				}
			} catch (error) {
				console.error('Failed to load quiz:', error);
				toast.error('Cannot load quiz. Please try again.');
				navigate({ to: '/dashboard' });
			} finally {
				if (mounted) {
					setLoading(false);
					setResuming(false);
				}
			}
		};
		initQuiz();
		return () => { mounted = false; };
	}, [type, targetId, navigate]);

	// Timer for final test
	useEffect(() => {
		if (!timeRemaining || type !== 'final' || showResult) return;
		const timer = setInterval(() => {
			setTimeRemaining(prev => {
				if (prev && prev > 0) {
					const newTime = prev - 1;
					return newTime;
				} else {
					// Time's up - auto submit
					handleSubmitRef.current?.();
					return 0;
				}
			});
		}, 1000);
		return () => clearInterval(timer);
	}, [timeRemaining, type, showResult]);

	// Network status detection
	useEffect(() => {
		const handleOnline = () => {
			setNetworkStatus('online');
			toast.success('Reconnected. Restoring progress...');
			// Resume quiz - use the ref to get current session ID
			if (sessionIdRef.current) {
				resumeQuiz(sessionIdRef.current).then(saved => {
					if (saved) {
						setSession(saved);
					}
				});
			}
		};
		const handleOffline = () => {
			setNetworkStatus('offline');
			toast.error('Network disconnected. Saving progress locally...');
		};
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);
		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []); // Empty deps - only run once on mount

	// Auto-save debounced — use a ref for the timer to avoid setState-in-effect infinite loops
	useEffect(() => {
		if (Object.keys(answers).length === 0) return;
		if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
		autoSaveTimerRef.current = setTimeout(async () => {
			if (sessionIdRef.current) {
				try {
					await autoSaveAnswers(sessionIdRef.current, answers);
					lastAutoSave.current = { ...answers };
					toast.success('Auto-saved', { duration: 1000 });
				} catch (e) {
					console.warn('Auto-save failed:', e);
				}
			}
		}, 1000);
		return () => {
			if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
		};
	}, [answers]);

	// Track question start time and blur events
	useEffect(() => {
		questionStartTime.current = Date.now();
		blurCount.current = 0;

		const handleBlur = () => { blurCount.current++; };
		window.addEventListener('blur', handleBlur);
		return () => window.removeEventListener('blur', handleBlur);
	}, [currentQuestionIndex]);

	const handleAnswer = useCallback((answer: string) => {
		const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
		const confidence = calculateConfidence({
			timeSpentMs: timeSpent * 1000,
			blurCount: blurCount.current,
			isCorrect: false // Will be determined on submit
		});

		setAnswers(prev => ({
			...prev,
			[currentQuestionIndex]: {
				answer,
				timeSpentSeconds: timeSpent,
				blurCount: blurCount.current,
				confidenceFlag: confidence
			}
		}));
	}, [currentQuestionIndex]);

	const handleNext = useCallback(() => {
		if (session && currentQuestionIndex < session.questions.length - 1) {
			setCurrentQuestionIndex(prev => prev + 1);
		}
	}, [session, currentQuestionIndex]);

	const handlePrevious = useCallback(() => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex(prev => prev - 1);
		}
	}, [currentQuestionIndex]);

	const handleSubmit = useCallback(async () => {
		const session = sessionRef.current;
		const answers = answersRef.current;
		if (!session) return;
		setSubmitting(true);
		try {
			// Ensure all answers have confidence flags calculated
			const finalAnswers: Record<number, UserAnswerRecord> = { ...answers };
			for (let i = 0; i < session.questions.length; i++) {
				if (!finalAnswers[i]) {
					finalAnswers[i] = {
						answer: '',
						timeSpentSeconds: 0,
						blurCount: 0,
						confidenceFlag: 'fail'
					};
				}
			}
			await autoSaveAnswers(session.id, finalAnswers);

			const quizResult = await submitQuiz(session.id);
			setResult(quizResult);
			setShowResult(true);
			onComplete?.(quizResult);
		} catch (error) {
			console.error('Submit failed:', error);
			toast.error('Submit failed. Please try again.');
		} finally {
			setSubmitting(false);
		}
	}, [onComplete]);

	// Keep handleSubmitRef in sync
	useEffect(() => {
		handleSubmitRef.current = handleSubmit;
	}, [handleSubmit]);

	// Auto-scroll dots to current question
	useEffect(() => {
		if (dotsContainerRef.current) {
			const container = dotsContainerRef.current;
			const activeDot = container.querySelector('[data-active="true"]');
			if (activeDot) {
				const containerRect = container.getBoundingClientRect();
				const dotRect = activeDot.getBoundingClientRect();
				const scrollLeft = dotRect.left - containerRect.left - (containerRect.width / 2) + (dotRect.width / 2);
				container.scrollTo({ left: container.scrollLeft + scrollLeft, behavior: 'smooth' });
			}
		}
	}, [currentQuestionIndex]);

	// Handle keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (showResult || loading || !sessionRef.current) return;

			// Number keys for options
			if (e.key >= '1' && e.key <= '9') {
				const question = sessionRef.current?.questions[currentQuestionIndex];
				if (question?.type === 'fill_blank' && e.key <= '4') {
					const options = question.data[1].split('|');
					const index = parseInt(e.key) - 1;
					if (options[index]) {
						handleAnswer(options[index]);
					}
				} else if (question?.type === 'multi_select') {
					const options = question.data[1].split('|');
					const index = parseInt(e.key) - 1;
					if (options[index]) {
						const current = (answersRef.current[currentQuestionIndex]?.answer || '')
							.split('|')
							.map(s => parseInt(s.trim(), 10))
							.filter(n => !isNaN(n));
						const selected = new Set(current);
						if (selected.has(index)) {
							selected.delete(index);
						} else {
							selected.add(index);
						}
						handleAnswer([...selected].sort((a, b) => a - b).join('|'));
					}
				}
			}

			// Enter to submit/next
			if (e.key === 'Enter' && !e.shiftKey) {
				if (answersRef.current[currentQuestionIndex]) {
					if (currentQuestionIndex < (sessionRef.current?.questions.length ?? 0) - 1) {
						handleNext();
					} else {
						handleSubmitRef.current?.();
					}
				}
			}

			// Arrow keys for navigation
			if (e.key === 'ArrowRight') handleNext();
			if (e.key === 'ArrowLeft') handlePrevious();
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [currentQuestionIndex, showResult, loading, handleAnswer, handleNext, handlePrevious]);

	if (loading || resuming) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
					<p className="text-gray-600">{resuming ? 'Restoring progress...' : 'Loading quiz...'}</p>
				</div>
			</div>
		);
	}

	if (!session) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
<p className="text-gray-600">Cannot load quiz</p>
							<Button onClick={() => navigate({ to: '/dashboard' })} className="mt-4">Go to Home</Button>
				</div>
			</div>
		);
	}

	const currentQuestion = session.questions[currentQuestionIndex];
	const progress = ((currentQuestionIndex + 1) / session.questions.length) * 100;
	const isLastQuestion = currentQuestionIndex === session.questions.length - 1;
	const canSubmit = Object.keys(answers).length > 0;

	// Format time for display
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<Toaster position="top-right" />

			{/* Header with Progress & Timer */}
			<header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
				<div className="max-w-3xl mx-auto px-4 py-3">
					<div className="flex items-center justify-between gap-4 mb-3">
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
								<span>{session.targetName}</span>
								<span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium capitalize">{type}</span>
							</div>
							<h1 className="text-lg font-semibold text-gray-900 truncate">
								Question {currentQuestionIndex + 1} / {session.questions.length}
							</h1>
						</div>
						{type === 'final' && timeRemaining !== null && (
							<div className={cn(
								'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono font-semibold',
								timeRemaining < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700'
							)}>
								<Clock className="w-4 h-4" />
								{formatTime(timeRemaining)}
							</div>
						)}
					</div>

					{/* Progress Bar */}
					<Progress value={progress} className="h-2" />

					{/* Network Status */}
					{networkStatus === 'offline' && (
						<div className="mt-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
							<WifiOff className="w-3 h-3" />
							<span>Offline - Saving locally</span>
						</div>
					)}
				</div>
			</header>

			{/* Question Content */}
			<main className="max-w-3xl mx-auto px-4 py-6">
				{/* Question Renderer */}
				<div className="animate-fade-in">
					{currentQuestion.type === 'fill_blank' && (
						<FillBlankQuestion
							key={currentQuestionIndex}
							data={currentQuestion.data as FillBlankQuestionData}
							questionNumber={currentQuestionIndex + 1}
							totalQuestions={session.questions.length}
							onAnswer={handleAnswer}
							isSubmitted={showResult}
							userAnswer={answers[currentQuestionIndex]?.answer}
						/>
					)}
					{currentQuestion.type === 'multi_select' && (
						<MultiSelectQuestion
							key={currentQuestionIndex}
							data={currentQuestion.data as MultiSelectQuestionData}
							questionNumber={currentQuestionIndex + 1}
							totalQuestions={session.questions.length}
							userAnswer={answers[currentQuestionIndex]?.answer || null}
							onAnswerChange={handleAnswer}
							isSubmitted={showResult}
							isCorrect={showResult && result?.questionResults?.[currentQuestionIndex]?.isCorrect}
							explanation={showResult ? result?.questionResults?.[currentQuestionIndex]?.explanation : undefined}
						/>
					)}
					{currentQuestion.type === 'ordering' && (
						<OrderingQuestion
							key={currentQuestionIndex}
							data={currentQuestion.data as OrderingQuestionData}
							questionNumber={currentQuestionIndex + 1}
							totalQuestions={session.questions.length}
							userAnswer={answers[currentQuestionIndex]?.answer || null}
							onAnswerChange={handleAnswer}
							isSubmitted={showResult}
							isCorrect={showResult && result?.questionResults?.[currentQuestionIndex]?.isCorrect}
							explanation={showResult ? result?.questionResults?.[currentQuestionIndex]?.explanation : undefined}
						/>
					)}
				</div>
			</main>

			{/* Navigation — full width sticky bottom bar */}
			{!showResult && (
				<nav className="sticky bottom-0 z-30 bg-white border-t border-gray-200">
					<div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
						<Button
							variant="outline"
							onClick={handlePrevious}
							disabled={submitting || currentQuestionIndex === 0}
							className="flex-shrink-0"
						>
<ChevronLeft className="w-4 h-4 mr-2" />
								Previous Question
						</Button>

						{/* Question Number Circles */}
						<div
							ref={dotsContainerRef}
							className="hidden md:flex flex-1 items-center gap-1.5 overflow-x-auto p-1"
						>
							{session.questions.map((_, i) => (
								<button
									key={i}
									onClick={() => setCurrentQuestionIndex(i)}
									data-active={i === currentQuestionIndex}
									className={cn(
										'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all',
										i === currentQuestionIndex && 'bg-blue-600 text-white ring-2 ring-blue-300',
										answers[i] && i !== currentQuestionIndex && 'bg-green-500 text-white',
										!answers[i] && i !== currentQuestionIndex && 'bg-gray-200 text-gray-600 hover:bg-gray-300',
										'hover:scale-105'
									)}
									aria-label={`Câu ${i + 1}`}
									disabled={showResult}
								>
									{i + 1}
								</button>
							))}
						</div>

						{!isLastQuestion ? (
							<Button onClick={handleNext} disabled={submitting} className="flex-shrink-0">
								Next Question
								<ChevronRight className="w-4 h-4 ml-2" />
							</Button>
						) : (
							<Button
								onClick={handleSubmit}
								disabled={submitting || !canSubmit}
								className="bg-green-600 hover:bg-green-700 flex-shrink-0"
							>
								{submitting ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin mr-2" />
										Grading...
									</>
								) : (
									'Submit'
								)}
							</Button>
						)}
					</div>
				</nav>
			)}

			{/* Result View */}
			{showResult && result && (
				<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up relative">
						<div className="absolute top-4 right-4 z-10">
							<Button variant="ghost" size="sm" onClick={() => navigate({ to: '/dashboard' })}>Close</Button>
						</div>
						<QuizResultAccordion
							result={result}
							onRetry={() => window.location.reload()}
							onReviewTheory={() => navigate({ to: '/dashboard' })}
						/>
					</div>
				</div>
			)}
		</div>
	);
}