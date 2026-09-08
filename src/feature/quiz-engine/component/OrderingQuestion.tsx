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
	explanation,
	revealAnswer = true,
}: OrderingQuestionProps) {
	const [instruction, stepsStr, correctAnswerStr, expl] = data;
	// Memoize these so their array references are stable between renders.
	// Without useMemo, a new array is created each render, making it an
	// unstable useEffect dependency that causes an infinite update loop.
	const originalSteps = useMemo(() => stepsStr.split('|'), [stepsStr]);
	const correctIndices = useMemo(() => correctAnswerStr.split('|').map(Number), [correctAnswerStr]);
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
		<div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h3 className="text-lg font-semibold text-gray-900">
					Question {questionNumber} / {totalQuestions} · <span className="text-gray-500 font-normal">Ordering</span>
				</h3>
				<div className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
					T
				</div>
			</div>

			{/* Instruction */}
			<div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
				<p className="font-medium text-orange-900 mb-2">📋 Instruction:</p>
				<p className="text-gray-800">{instruction}</p>
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
							'relative flex items-start gap-3 rounded-xl border-2 p-4 transition-all sm:items-center sm:gap-4',
							'bg-white hover:bg-gray-50',
							isSubmitted
								? revealAnswer && orderedSteps.every((s, i) => s === correctOrder[i])
									? 'border-green-300 bg-green-50'
									: showFailedState
										? 'border-red-300 bg-red-50'
										: 'border-gray-200'
								: draggedIndex === index
								? 'border-blue-400 bg-blue-50 opacity-75 rotate-1 scale-105 shadow-lg'
								: 'border-gray-200'
						)}
						style={{ cursor: isSubmitted ? 'default' : 'grab' }}
					>
						{/* Drag Handle */}
						<div className={cn(
							'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
							'text-gray-400 hover:text-gray-600 active:text-gray-900',
							isSubmitted && 'cursor-default opacity-50'
						)}>
							<GripVertical className="w-5 h-5" />
						</div>

						{/* Step Number */}
						<div className={cn(
							'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg font-bold',
							isSubmitted
								? revealAnswer && step === correctOrder[index]
									? 'bg-green-100 text-green-700'
									: showFailedState
										? 'bg-red-100 text-red-700'
										: 'bg-gray-100 text-gray-600'
								: 'bg-gray-100 text-gray-600'
						)}>
							{index + 1}
						</div>

						{/* Step Content */}
						<div className="min-w-0 flex-1 break-words font-medium text-gray-900">{step}</div>

						{/* Result Indicators */}
						{isSubmitted && revealAnswer && (
							<div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
								{step === correctOrder[index] ? (
									<Check className="w-5 h-5 text-green-500" />
								) : (
									<X className="w-5 h-5 text-red-500" />
								)}
							</div>
						)}
					</div>
				))}
			</div>

			{/* Reset Button */}
			{!isSubmitted && (
				<button
					type="button"
					onClick={() => {
						const shuffled = [...originalSteps].sort(() => Math.random() - 0.5);
						setOrderedSteps(shuffled);
						onAnswerChange(shuffled.map(s => originalSteps.indexOf(s)).join('|'));
					}}
					className="w-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
				>
					🔄 Shuffle Again
				</button>
			)}

			{/* Explanation */}
			{isSubmitted && revealAnswer && (
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
