import { fetchWithAuthRetry } from "@/common/lib/authSession";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

function jsonHeaders(): HeadersInit {
    return {
        'Content-Type': 'application/json',
    };
}

export interface QuizReviewQuestionItem {
    review_id: number;
    lesson_id: number;
    lesson_title: string;
    question_id: string;
    question_type: 'fill_blank' | 'multi_select' | 'ordering';
    stem: string;
    options: string[];
    explanation: string;
    wrong_count: number;
}

export interface QuizReviewListResponse {
    total_count: number;
    review_questions: QuizReviewQuestionItem[];
}

export interface QuizReviewItemResult {
    review_id: number;
    question_id: string;
    question_type: string;
    stem: string;
    options?: string[];
    user_answer: string;
    correct_answer: string;
    explanation: string;
    is_correct: boolean;
    removed: boolean;
}

export interface QuizReviewSubmitResponse {
    results: QuizReviewItemResult[];
    cleared_count: number;
    failed_count: number;
    total_reviewed: number;
    remaining_count: number;
}

export async function fetchQuizReview(limit = 5): Promise<QuizReviewListResponse> {
    const res = await fetchWithAuthRetry(`${BASE_URL}/user/me/quiz-review?limit=${limit}`, {
        method: 'GET',
        headers: jsonHeaders(),
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch quiz review questions: ${res.statusText}`);
    }

    return await res.json();
}

export async function submitQuizReview(
    answers: { review_id: number; answer: string }[]
): Promise<QuizReviewSubmitResponse> {
    const res = await fetchWithAuthRetry(`${BASE_URL}/user/me/quiz-review/submit`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ answers }),
    });

    if (!res.ok) {
        throw new Error(`Failed to submit quiz review answers: ${res.statusText}`);
    }

    return await res.json();
}
