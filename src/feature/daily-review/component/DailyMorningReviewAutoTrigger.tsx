import { useEffect, useState } from "react";
import { useAuth } from "@/common/context/AuthContext";
import { getTodayDateKey } from "@/common/utils/dailyStudyGoal";
import { fetchQuizReview, type QuizReviewQuestionItem } from "../api/quizReviewApi";
import { DailyReviewDialog } from "./DailyReviewDialog";

export function DailyMorningReviewAutoTrigger() {
    const { user, isAuthenticated } = useAuth();
    const userId = Number(user?.id);
    const [isOpen, setIsOpen] = useState(false);
    const [questions, setQuestions] = useState<QuizReviewQuestionItem[]>([]);

    useEffect(() => {
        if (!isAuthenticated || !Number.isFinite(userId) || userId <= 0) {
            return;
        }

        const todayKey = getTodayDateKey();
        const shownKey = `careerpath:morning-review-shown:${userId}`;
        const lastShownDate = localStorage.getItem(shownKey);

        // If already shown today, do not auto-popup
        if (lastShownDate === todayKey) {
            return;
        }

        let isMounted = true;
        const checkReviewQuestions = async () => {
            try {
                const data = await fetchQuizReview(5);
                if (!isMounted) return;

                if (data.total_count > 0 && data.review_questions.length > 0) {
                    setQuestions(data.review_questions);
                    // Mark as shown today so subsequent page navigations today don't re-trigger popup
                    localStorage.setItem(shownKey, todayKey);
                    setIsOpen(true);
                }
            } catch {
                // Silently ignore if offline or network failure
            }
        };

        void checkReviewQuestions();

        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, userId]);

    // Listen for manual trigger events from elsewhere in the UI
    useEffect(() => {
        const handleManualOpen = () => {
            setQuestions([]); // Will fetch fresh on open
            setIsOpen(true);
        };

        window.addEventListener("careerpath:open-daily-review", handleManualOpen);
        return () => {
            window.removeEventListener("careerpath:open-daily-review", handleManualOpen);
        };
    }, []);

    if (!isAuthenticated) return null;

    return (
        <DailyReviewDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            preloadedQuestions={questions.length > 0 ? questions : undefined}
            onCompleted={(remaining) => {
                window.dispatchEvent(
                    new CustomEvent("careerpath:review-updated", {
                        detail: { remainingCount: remaining },
                    })
                );
            }}
        />
    );
}
