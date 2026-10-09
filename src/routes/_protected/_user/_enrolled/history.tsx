import { createFileRoute } from "@tanstack/react-router";
import { HistoryPage } from "@/feature/quiz-history";

export const Route = createFileRoute("/_protected/_user/_enrolled/history")({
	component: HistoryPage,
});
