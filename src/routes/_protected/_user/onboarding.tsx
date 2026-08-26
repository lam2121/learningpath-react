import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { fetchOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'

export const Route = createFileRoute('/_protected/_user/onboarding')({
    beforeLoad: async () => {
        const status = await fetchOnboardingStatus().catch(() => ({
            learning_status:
                'none'
        }))
        if (status.learning_status === 'enrolled') {
            throw redirect({ to: '/profile' })
        }
    },
    component: () => <Outlet />,
})
