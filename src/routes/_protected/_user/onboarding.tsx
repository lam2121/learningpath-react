import { createFileRoute, redirect, Outlet, isRedirect } from '@tanstack/react-router'
import { fetchOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'

export const Route = createFileRoute('/_protected/_user/onboarding')({
    beforeLoad: async ({ location }) => {
        try {
            const status = await fetchOnboardingStatus()
            const isPlacementResultRoute = location.pathname.endsWith('/onboarding/placement-result')

            // The result page is shown immediately after the placement test completes,
            // so allow that route even though the backend has already flipped to enrolled.
            if (
                status.learning_status === 'enrolled' &&
                !isPlacementResultRoute
            ) {
                throw redirect({ to: '/profile' })
            }
        } catch (err) {
            if (isRedirect(err)) {
                throw err
            }
            console.warn('Cannot reach server to check onboarding status:', err)
        }
    },
    component: () => (
        <div className="min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-white text-slate-900 light flex flex-col" data-theme="light">
            <Outlet />
        </div>
    ),
})
