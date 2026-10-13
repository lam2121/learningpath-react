import { useCallback, useState } from "react";

export interface LessonQuizSessionState {
  currentQuestionIndex: number;
  answers: Record<number, string>;
  hintedQuestions: Record<number, boolean>;
  submitted: boolean;
  showSummary: boolean;
  showIncompleteWarning: boolean;
  quizStarted: boolean;
  setCurrentQuestionIndex: (index: number) => void;
  setAnswers: (answers: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void;
  setSubmitted: (submitted: boolean) => void;
  setShowSummary: (show: boolean) => void;
  setShowIncompleteWarning: (show: boolean) => void;
  setQuizStarted: (started: boolean) => void;
  setHintedQuestions: (hints: Record<number, boolean> | ((prev: Record<number, boolean>) => Record<number, boolean>)) => void;
  handleAnswerChange: (questionIndex: number, answer: string) => void;
  handleHintUsed: (questionIndex: number) => void;
  resetSession: () => void;
}

export function useLessonQuizSession(): LessonQuizSessionState {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [hintedQuestions, setHintedQuestions] = useState<Record<number, boolean>>({});

  const handleAnswerChange = useCallback((questionIndex: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  }, []);

  const handleHintUsed = useCallback((questionIndex: number) => {
    setHintedQuestions((prev) => ({
      ...prev,
      [questionIndex]: true,
    }));
  }, []);

  const resetSession = useCallback(() => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSubmitted(false);
    setShowSummary(false);
    setShowIncompleteWarning(false);
    setQuizStarted(false);
    setHintedQuestions({});
  }, []);

  return {
    currentQuestionIndex,
    answers,
    hintedQuestions,
    submitted,
    showSummary,
    showIncompleteWarning,
    quizStarted,
    setCurrentQuestionIndex,
    setAnswers,
    setSubmitted,
    setShowSummary,
    setShowIncompleteWarning,
    setQuizStarted,
    setHintedQuestions,
    handleAnswerChange,
    handleHintUsed,
    resetSession,
  };
}
