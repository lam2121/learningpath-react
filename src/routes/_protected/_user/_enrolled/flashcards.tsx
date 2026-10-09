import { createFileRoute } from "@tanstack/react-router";
import { FlashcardsPage } from "@/feature/flashcards";

export const Route = createFileRoute("/_protected/_user/_enrolled/flashcards")({
	component: FlashcardsPage,
});
