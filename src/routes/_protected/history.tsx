import { createFileRoute } from "@tanstack/react-router";

import { HistoryPage } from "@/feature/user-profile/page/history-page";

export const Route = createFileRoute("/_protected/history")({
    component: HistoryPage,
});
