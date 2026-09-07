import { createFileRoute } from "@tanstack/react-router";
import { FlashcardsPage } from "@/feature/user-profile/page/flashcards-page";

export const Route = createFileRoute("/_protected/_user/_enrolled/flashcards")({
	component: FlashcardsPage,
});
