import { fetchWithAuthRetry } from "@/common/lib/authSession";
import { API_BASE_URL as BASE_URL } from "@/const/appConst";

function defaultHeaders(): HeadersInit {
	return {
		"Content-Type": "application/json",
	};
}

async function handleResponse<T>(res: Response): Promise<T> {
	if (!res.ok) {
		const errorData = await res.json().catch(() => ({ detail: res.statusText }));
		throw new Error(errorData.detail ?? "Failed to update flashcards.");
	}
	return res.json() as Promise<T>;
}

export interface Flashcard {
	id: number;
	word_eng: string;
	word_vi: string | null;
	word_ja: string | null;
	transcription: string | null;
	context: string | null;
	workspace_example: string | null;
}

export interface FlashcardCreatePayload {
	word_eng: string;
	word_vi?: string | null;
	word_ja?: string | null;
	transcription?: string | null;
	context?: string | null;
	workspace_example?: string | null;
}

export async function fetchFlashcards(): Promise<Flashcard[]> {
	const res = await fetchWithAuthRetry(`${BASE_URL}/flashcard`, {
		method: "GET",
		headers: defaultHeaders(),
	});
	return handleResponse<Flashcard[]>(res);
}

export async function saveFlashcard(
	payload: FlashcardCreatePayload,
): Promise<Flashcard> {
	const res = await fetchWithAuthRetry(`${BASE_URL}/flashcard`, {
		method: "POST",
		headers: defaultHeaders(),
		body: JSON.stringify(payload),
	});
	return handleResponse<Flashcard>(res);
}

export async function deleteFlashcard(flashcardId: number): Promise<void> {
	const res = await fetchWithAuthRetry(`${BASE_URL}/flashcard/${flashcardId}`, {
		method: "DELETE",
		headers: defaultHeaders(),
	});
	if (!res.ok) {
		const errorData = await res.json().catch(() => ({ detail: res.statusText }));
		throw new Error(errorData.detail ?? "Failed to remove flashcard.");
	}
}
