import { useCallback, useRef, type MutableRefObject } from "react";

export interface QuizNavigatorAnimationController {
  questionNavigatorRef: MutableRefObject<HTMLDivElement | null>;
  activeQuestionButtonRef: MutableRefObject<HTMLButtonElement | null>;
  stopQuestionNavigatorAnimation: () => void;
  centerActiveButton: () => void;
}

export function useQuizNavigatorAnimation(): QuizNavigatorAnimationController {
  const questionNavigatorRef = useRef<HTMLDivElement | null>(null);
  const activeQuestionButtonRef = useRef<HTMLButtonElement | null>(null);
  const navigatorScrollFrameRef = useRef<number | null>(null);
  const navigatorScrollTargetRef = useRef(0);

  const stopQuestionNavigatorAnimation = useCallback(() => {
    if (navigatorScrollFrameRef.current !== null) {
      window.cancelAnimationFrame(navigatorScrollFrameRef.current);
      navigatorScrollFrameRef.current = null;
    }

    const navigator = questionNavigatorRef.current;
    navigatorScrollTargetRef.current = navigator?.scrollLeft ?? 0;
  }, []);

  const centerActiveButton = useCallback(() => {
    const navigator = questionNavigatorRef.current;
    const button = activeQuestionButtonRef.current;
    if (!navigator || !button) return;

    const navRect = navigator.getBoundingClientRect();
    const btnRect = button.getBoundingClientRect();
    const offset = btnRect.left - navRect.left - (navRect.width / 2 - btnRect.width / 2);

    navigator.scrollTo({
      left: navigator.scrollLeft + offset,
      behavior: "smooth",
    });
  }, []);

  return {
    questionNavigatorRef,
    activeQuestionButtonRef,
    stopQuestionNavigatorAnimation,
    centerActiveButton,
  };
}
