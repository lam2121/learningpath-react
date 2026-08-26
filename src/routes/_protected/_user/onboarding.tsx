import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { fetchOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'

export const Route = createFileRoute('/_protected/_user/onboarding')({
    beforeLoad: async ({ location }) => {
        const status = await fetchOnboardingStatus().catch(() => ({
            learning_status: 'none',
        }))

        // The result page is shown immediately after the placement test completes,
        // so allow that route even though the backend has already flipped to enrolled.
        if (
            status.learning_status === 'enrolled' &&
            !location.pathname.endsWith('/careerpath/onboarding/placement-result')
        ) {
            throw redirect({ to: '/profile' })
        }
    },
    component: () => <Outlet />,
})
