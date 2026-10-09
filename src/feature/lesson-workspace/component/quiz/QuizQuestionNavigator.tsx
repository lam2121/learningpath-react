import type { WheelEvent as ReactWheelEvent, RefObject } from "react";
import type { EmbeddedQuizQuestion } from "../../type/lessonWorkspace";
import { hasAnswer } from "../../util/embeddedQuizPersistence";

export interface QuizQuestionNavigatorProps {
    questions: EmbeddedQuizQuestion[];
    currentQuestionIndex: number;
    answers: Record<number, string>;
    hintedQuestions: Record<number, boolean>;
    submitted: boolean;
    isQuestionCorrect: (question: EmbeddedQuizQuestion, index: number) => boolean;
    onSelectQuestion: (index: number) => void;
    questionNavigatorRef: RefObject<HTMLDivElement | null>;
    activeQuestionButtonRef: RefObject<HTMLButtonElement | null>;
    onWheel: (e: ReactWheelEvent<HTMLDivElement>) => void;
    onMouseDown: () => void;
    onTouchStart: () => void;
    onScroll: () => void;
}

export function QuizQuestionNavigator({
    questions,
    currentQuestionIndex,
    answers,
    hintedQuestions,
    submitted,
    isQuestionCorrect,
    onSelectQuestion,
    questionNavigatorRef,
    activeQuestionButtonRef,
    onWheel,
    onMouseDown,
    onTouchStart,
    onScroll,
}: QuizQuestionNavigatorProps) {
    return (
        <div
            ref={questionNavigatorRef}
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            onScroll={onScroll}
            className="flex gap-2 overflow-x-auto overscroll-x-contain overscroll-y-contain pb-5 pt-1 px-0.5"
        >
            {questions.map((question, index) => {
                const isActive = index === currentQuestionIndex;
                const isAnswered = hasAnswer(answers[index]);
                const isCorrect = submitted && isQuestionCorrect(question, index);
                const usedHint = Boolean(hintedQuestions[index]);

                return (
                    <button
                        key={question.id}
                        type="button"
                        ref={isActive ? activeQuestionButtonRef : null}
                        aria-current={isActive ? "step" : undefined}
                        onClick={() => onSelectQuestion(index)}
                        className={[
                            "flex h-10 w-10 min-w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                            isActive
                                ? "border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950/40"
                                : submitted && isCorrect && usedHint
                                ? "border-amber-300 bg-amber-50 text-amber-700"
                                : submitted && isCorrect
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : submitted
                                ? "border-rose-300 bg-rose-50 text-rose-700"
                                : usedHint
                                ? "border-amber-300 bg-amber-50 text-amber-700"
                                : isAnswered
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                        ].join(" ")}
                        title={
                            submitted
                                ? `Question ${index + 1}: ${isCorrect ? "Correct" : "Needs review"}`
                                : usedHint
                                ? `Question ${index + 1}: Hint used`
                                : isAnswered
                                ? `Question ${index + 1}: Answered`
                                : `Question ${index + 1}: Unanswered`
                        }
                    >
                        {index + 1}
                    </button>
                );
            })}
        </div>
    );
}
