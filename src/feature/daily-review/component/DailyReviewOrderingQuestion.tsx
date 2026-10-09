import React, { useRef, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, RotateCcw } from "lucide-react";
import type { QuizReviewQuestionItem } from "../api/quizReviewApi";
import { getInitialOrderingIndices } from "../utils/dailyReviewFormatters";

interface DailyReviewOrderingQuestionProps {
    question: QuizReviewQuestionItem;
    userAnswer: string | undefined;
    onAnswerChange: (answer: string) => void;
}

export function DailyReviewOrderingQuestion({
    question,
    userAnswer,
    onAnswerChange,
}: DailyReviewOrderingQuestionProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const draggedIndexRef = useRef<number | null>(null);
    const touchDragIndexRef = useRef<number | null>(null);

    const getOrderingStepItems = (): Array<{ originalIndex: number; text: string }> => {
        let indices: number[];
        if (userAnswer && userAnswer.trim() !== "") {
            const parsed = userAnswer.split("|").map(Number).filter((n) => !Number.isNaN(n));
            if (parsed.length === question.options.length) {
                indices = parsed;
            } else {
                indices = getInitialOrderingIndices(question.options.length);
            }
        } else {
            indices = getInitialOrderingIndices(question.options.length);
        }
        return indices.map((idx) => ({
            originalIndex: idx,
            text: question.options[idx] ?? "",
        }));
    };

    const handleReorder = (fromIdx: number, toIdx: number) => {
        const currentItems = getOrderingStepItems();
        if (toIdx < 0 || toIdx >= currentItems.length || fromIdx === toIdx) return;

        const nextItems = [...currentItems];
        const [moved] = nextItems.splice(fromIdx, 1);
        nextItems.splice(toIdx, 0, moved);

        const newAnswer = nextItems.map((item) => item.originalIndex).join("|");
        onAnswerChange(newAnswer);
    };

    const handleResetOrdering = () => {
        const initialIndices = getInitialOrderingIndices(question.options.length);
        onAnswerChange(initialIndices.join("|"));
    };

    // Drag-and-drop handlers (Desktop)
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        draggedIndexRef.current = index;
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(index));
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const fromIndex = draggedIndexRef.current;
        if (fromIndex === null || fromIndex === index) return;

        handleReorder(fromIndex, index);
        draggedIndexRef.current = index;
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        draggedIndexRef.current = null;
        setDraggedIndex(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        draggedIndexRef.current = null;
        setDraggedIndex(null);
    };

    // Touch handlers (Mobile & touch displays)
    const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, index: number) => {
        touchDragIndexRef.current = index;
        setDraggedIndex(index);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (touchDragIndexRef.current === null) return;
        const touch = e.touches[0];
        if (!touch) return;

        const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
        const cardEl = targetEl?.closest("[data-step-index]");
        if (!cardEl) return;

        const targetIndexStr = cardEl.getAttribute("data-step-index");
        if (targetIndexStr === null) return;

        const targetIndex = Number(targetIndexStr);
        const fromIndex = touchDragIndexRef.current;
        if (Number.isNaN(targetIndex) || fromIndex === null || fromIndex === targetIndex) return;

        handleReorder(fromIndex, targetIndex);
        touchDragIndexRef.current = targetIndex;
        setDraggedIndex(targetIndex);
    };

    const handleTouchEnd = () => {
        touchDragIndexRef.current = null;
        setDraggedIndex(null);
    };

    const items = getOrderingStepItems();

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                {items.map((item, idx, arr) => {
                    const isDragging = draggedIndex === idx;

                    return (
                        <div
                            key={`step-${item.originalIndex}`}
                            data-step-index={idx}
                            draggable
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDragEnd={handleDragEnd}
                            onDrop={handleDrop}
                            onTouchStart={(e) => handleTouchStart(e, idx)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onTouchCancel={handleTouchEnd}
                            className={`group relative flex items-center justify-between gap-3 rounded-2xl border p-3.5 text-sm font-medium transition-all duration-150 select-none ${
                                isDragging
                                    ? "border-blue-400 bg-blue-50/90 text-blue-950 shadow-lg ring-2 ring-blue-400/50 scale-[1.01] cursor-grabbing z-10 dark:border-blue-500 dark:bg-blue-950/80 dark:text-blue-100"
                                    : "border-slate-200 bg-white text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50/70 cursor-grab dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                    className="flex items-center text-slate-400 group-hover:text-slate-600 transition-colors touch-none cursor-grab active:cursor-grabbing shrink-0 dark:text-slate-500 dark:group-hover:text-slate-300"
                                    title="Hold and release to reorder"
                                >
                                    <GripVertical className="h-5 w-5" />
                                </div>

                                <span
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                                        isDragging
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                    }`}
                                >
                                    {idx + 1}
                                </span>

                                <span className="truncate sm:whitespace-normal text-slate-800 dark:text-slate-200 leading-snug">
                                    {item.text}
                                </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleReorder(idx, idx - 1);
                                    }}
                                    title="Move step up"
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-25 disabled:pointer-events-none transition-colors dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    disabled={idx === arr.length - 1}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleReorder(idx, idx + 1);
                                    }}
                                    title="Move step down"
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-25 disabled:pointer-events-none transition-colors dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                >
                                    <ArrowDown className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                    <GripVertical className="h-3.5 w-3.5" />
                    Hold and drag any step to reorder
                </span>
                <button
                    type="button"
                    onClick={handleResetOrdering}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                    <RotateCcw className="h-3 w-3" />
                    Reset order
                </button>
            </div>
        </div>
    );
}
