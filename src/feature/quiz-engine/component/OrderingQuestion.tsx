import { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from '@/shadcn/lib/util';
import { GripVertical, Check, X } from 'lucide-react';

interface OrderingQuestionProps {
	questionNumber: number;
	totalQuestions: number;
	data: [
		instruction: string,
		steps: string,
		answer: string,
		explanation: string,
		wD: number, wC: number, wT: number, wG: number,
		remD: number, remC: number, remT: number, remG: number
	];
	userAnswer: string | null; // format: "1|0|2|3"
	onAnswerChange: (answer: string) => void;
	isSubmitted: boolean;
	isCorrect?: boolean;
	correctAnswer?: string;
	explanation?: string;
	revealAnswer?: boolean;
}

export function OrderingQuestion({
	questionNumber,
	totalQuestions,
	data,
	userAnswer,
	onAnswerChange,
	isSubmitted,
	isCorrect,
	correctAnswer: explicitCorrectAnswer,
	explanation,
	revealAnswer = true,
}: OrderingQuestionProps) {
	const [instruction, stepsStr, dataCorrectAnswerStr, expl] = data;
	const correctAnswerStr = explicitCorrectAnswer ?? dataCorrectAnswerStr;
	// Memoize these so their array references are stable between renders.
	// Without useMemo, a new array is created each render, making it an
	// unstable useEffect dependency that causes an infinite update loop.
	const originalSteps = useMemo(() => stepsStr.split('|'), [stepsStr]);
	const correctIndices = useMemo(() => (correctAnswerStr ? correctAnswerStr.split('|').map(Number) : []), [correctAnswerStr]);
	const correctOrder = useMemo(() => correctIndices.map(i => originalSteps[i]), [correctIndices, originalSteps]);
	const showFailedState = isSubmitted && !revealAnswer && isCorrect === false;

	// Initialize state with user's answer or shuffled order
	const [orderedSteps, setOrderedSteps] = useState(() => {
		if (userAnswer) {
			const indices = userAnswer.split('|').map(Number);
			return indices.map(i => originalSteps[i]);
		}
		// Shuffle for initial display
		return [...originalSteps].sort(() => Math.random() - 0.5);
	});

	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const draggedIndexRef = useRef<number | null>(null);
	const touchDragIndexRef = useRef<number | null>(null);

	// Generate answer string from current order
	const generateAnswer = (steps = orderedSteps) => {
		const indices = steps.map(step => originalSteps.indexOf(step));
		return indices.join('|');
	};

	// Handle drag start
	const handleDragStart = (index: number) => {
		if (isSubmitted) return;
		draggedIndexRef.current = index;
		setDraggedIndex(index);
	};

	// Handle drag over
	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		const fromIndex = draggedIndexRef.current;
		if (isSubmitted || fromIndex === null || fromIndex === index) return;

		setOrderedSteps(prev => {
			const newSteps = [...prev];
			const [removed] = newSteps.splice(fromIndex, 1);
			newSteps.splice(index, 0, removed);
			return newSteps;
		});
		draggedIndexRef.current = index;
		setDraggedIndex(index);
	};

	// Handle drag end
	const handleDragEnd = () => {
		draggedIndexRef.current = null;
		setDraggedIndex(null);
		if (!isSubmitted) {
			onAnswerChange(generateAnswer());
		}
	};

	// Touch handlers for mobile & touch displays
	const handleTouchStart = (index: number) => {
		if (isSubmitted) return;
		touchDragIndexRef.current = index;
		setDraggedIndex(index);
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (isSubmitted || touchDragIndexRef.current === null) return;
		const touch = e.touches[0];
		if (!touch) return;

		const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
		const cardEl = targetEl?.closest('[data-ordering-index]');
		if (!cardEl) return;

		const targetIndexStr = cardEl.getAttribute('data-ordering-index');
		if (targetIndexStr === null) return;

		const targetIndex = Number(targetIndexStr);
		const fromIndex = touchDragIndexRef.current;
		if (Number.isNaN(targetIndex) || fromIndex === null || fromIndex === targetIndex) return;

		setOrderedSteps(prev => {
			const newSteps = [...prev];
			const [removed] = newSteps.splice(fromIndex, 1);
			newSteps.splice(targetIndex, 0, removed);
			return newSteps;
		});
		touchDragIndexRef.current = targetIndex;
		setDraggedIndex(targetIndex);
	};

	const handleTouchEnd = () => {
		touchDragIndexRef.current = null;
		setDraggedIndex(null);
		if (!isSubmitted) {
			onAnswerChange(generateAnswer());
		}
	};

	// Update answer when order changes
	const handleOrderChange = () => {
		if (!isSubmitted) {
			onAnswerChange(generateAnswer());
		}
	};

	// Sync with userAnswer prop
	useEffect(() => {
		if (userAnswer && !isSubmitted) {
			const indices = userAnswer.split('|').map(Number);
			const newOrder = indices.map(i => originalSteps[i]);
			setOrderedSteps(newOrder);
		}
	}, [userAnswer, isSubmitted, originalSteps]);

	return (
		<div className="space-y-6 rounded-3xl border border-border/80 bg-card p-5 shadow-elevation-1 sm:p-7">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h3 className="font-display text-lg font-bold text-foreground">
					Question {questionNumber} / {totalQuestions} · <span className="text-muted-foreground font-normal">Ordering</span>
				</h3>
				<div className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
					Sequence
				</div>
			</div>

			{/* Instruction */}
			<div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 sm:p-5 backdrop-blur-xs">
				<p className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">Instruction</p>
				<p className="font-display text-base font-semibold text-foreground sm:text-lg leading-relaxed">{instruction}</p>
			</div>

			{/* Drag and Drop List */}
			<div className="space-y-3" role="list" aria-label="Steps to order">
				{orderedSteps.map((step, index) => (
					<div
						key={step}
						data-ordering-index={index}
						draggable={!isSubmitted}
						onDragStart={() => handleDragStart(index)}
						onDragOver={e => handleDragOver(e, index)}
						onDragEnd={handleDragEnd}
						onDrop={handleOrderChange}
						onTouchStart={() => handleTouchStart(index)}
						onTouchMove={handleTouchMove}
						onTouchEnd={handleTouchEnd}
						onTouchCancel={handleTouchEnd}
						className={cn(
							'relative flex items-start gap-3.5 rounded-2xl border-2 p-4 transition-all duration-200 sm:items-center sm:gap-4',
							'bg-card hover:bg-muted/50 border-border',
							isSubmitted
								? revealAnswer && orderedSteps.every((s, i) => s === correctOrder[i])
									? 'border-emerald-500 bg-emerald-500/10'
									: showFailedState
										? 'border-rose-500 bg-rose-500/10'
										: 'border-border'
								: draggedIndex === index
								? 'border-primary bg-primary/10 opacity-80 scale-102 shadow-elevation-3'
								: 'border-border'
						)}
						style={{ cursor: isSubmitted ? 'default' : 'grab' }}
					>
						{/* Drag Handle */}
						<div className={cn(
							'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
							'text-muted-foreground hover:text-foreground active:text-primary',
							isSubmitted && 'cursor-default opacity-40'
						)}>
							<GripVertical className="w-5 h-5" />
						</div>

						{/* Step Number */}
						<div className={cn(
							'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold font-mono',
							isSubmitted
								? revealAnswer && step === correctOrder[index]
									? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
									: showFailedState
										? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
										: 'bg-muted text-muted-foreground'
								: 'bg-muted text-foreground'
						)}>
							{index + 1}
						</div>

						{/* Step Content */}
						<div className="min-w-0 flex-1 break-words font-semibold text-foreground text-sm sm:text-base leading-relaxed">{step}</div>

						{/* Result Indicators */}
						{isSubmitted && revealAnswer && (
							<div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
								{step === correctOrder[index] ? (
									<Check className="w-5 h-5 text-emerald-500" />
								) : (
									<X className="w-5 h-5 text-rose-500" />
								)}
							</div>
						)}
					</div>
				))}
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
