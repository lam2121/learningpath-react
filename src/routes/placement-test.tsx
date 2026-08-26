import { createFileRoute, redirect } from '@tanstack/react-router'
import { PlacementTestPage } from '@/feature/onboarding/page/PlacementTestPage'
import { fetchOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'

export const Route = createFileRoute('/placement-test')({
	beforeLoad: async ({ context }) => {
		if (!context.auth.isAuthenticated) {
			throw redirect({ to: '/login' })
		}
		if (context.auth.user?.role_id === 2) {
			throw redirect({ to: '/admin' })
		}
		// Learner → check if placement test is finished
		const status = await fetchOnboardingStatus().catch(() => ({ learning_status: 'none' }))
		if (status.learning_status === 'enrolled') {
			throw redirect({ to: '/profile' })
		}
		throw redirect({ to: '/onboarding/role-selection' })
	},
	component: PlacementTestPage,
})
