import type {
    LessonQuizQuestionResult,
    TopicQuizQuestionResult,
    FinalQuizQuestionResult,
} from '@/feature/learning-path/api/roadmapApi';
import { FillBlankQuestion } from '@/feature/quiz-engine/component/FillBlankQuestion';
import { MultiSelectQuestion } from '@/feature/quiz-engine/component/MultiSelectQuestion';
import { OrderingQuestion } from '@/feature/quiz-engine/component/OrderingQuestion';
import type {
    FillBlankQuestionData,
    MultiSelectQuestionData,
    OrderingQuestionData,
} from '@/feature/quiz-engine/type/Quiz';

export type ReadonlyQuizQuestionResult =
    | LessonQuizQuestionResult
    | TopicQuizQuestionResult
    | FinalQuizQuestionResult;

export interface ReadonlyQuizQuestionProps {
    result: ReadonlyQuizQuestionResult;
    questionNumber: number;
    totalQuestions: number;
    attemptPassed?: boolean;
    revealAnswer?: boolean;
}

export function buildReadonlyQuestionData(
    result: ReadonlyQuizQuestionResult,
): FillBlankQuestionData | MultiSelectQuestionData | OrderingQuestionData {
    const optionsStr = Array.isArray(result.options)
        ? result.options.join('|')
        : (result.options ?? '');

    const base = [
        result.question_text ?? '',
        optionsStr,
        result.correct_answer ?? '',
        result.explanation ?? '',
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
    ] as const;

    return [...base] as FillBlankQuestionData | MultiSelectQuestionData | OrderingQuestionData;
}

export function ReadonlyQuizQuestion({
    result,
    questionNumber,
    totalQuestions,
    attemptPassed,
    revealAnswer,
}: ReadonlyQuizQuestionProps) {
    const shouldReveal = attemptPassed ?? revealAnswer ?? true;
    const explanationToShow = shouldReveal ? result.explanation : undefined;
    const data = buildReadonlyQuestionData(result);

    if (result.question_type === 'fill_blank') {
        return (
            <FillBlankQuestion
                data={data as FillBlankQuestionData}
                questionNumber={questionNumber}
                totalQuestions={totalQuestions}
                onAnswer={() => {}}
                isSubmitted
                userAnswer={result.user_answer}
                revealAnswer={shouldReveal}
            />
        );
    }

    if (result.question_type === 'multi_select') {
        return (
            <MultiSelectQuestion
                data={data as MultiSelectQuestionData}
                questionNumber={questionNumber}
                totalQuestions={totalQuestions}
                userAnswer={result.user_answer}
                onAnswerChange={() => {}}
                isSubmitted
                isCorrect={result.is_correct}
                explanation={explanationToShow}
                revealAnswer={shouldReveal}
            />
        );
    }

    return (
        <OrderingQuestion
            data={data as OrderingQuestionData}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            userAnswer={result.user_answer}
            onAnswerChange={() => {}}
            isSubmitted
            isCorrect={result.is_correct}
            explanation={explanationToShow}
            revealAnswer={shouldReveal}
        />
    );
}
