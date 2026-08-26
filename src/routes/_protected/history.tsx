import { createFileRoute, redirect } from "@tanstack/react-router";
import { fetchOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'

import { HistoryPage } from "@/feature/user-profile/page/history-page";

export const Route = createFileRoute("/_protected/history")({
    beforeLoad: async () => {
        // Learner → check if placement test is finished
        const status = await fetchOnboardingStatus().catch(() => ({ learning_status: 'none' }))
        if (status.learning_status === 'enrolled') {
            throw redirect({ to: '/profile' })
        }
        throw redirect({ to: '/onboarding/role-selection' })
    },
    component: HistoryPage,
});
