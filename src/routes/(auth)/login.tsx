import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginPage } from '@/feature/auth/page/LoginPage'
import { fetchOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'

export const Route = createFileRoute('/(auth)/login')({
	beforeLoad: async ({ context }) => {
		if (context.auth.isAuthenticated) {
			const role_id = context.auth.user?.role_id

			// Admin → redirect to admin dashboard
			if (role_id === 2) {
				throw redirect({ to: '/admin' })
			}

			// Learner → check onboarding status
			const status = await fetchOnboardingStatus().catch(() => ({ has_completed_survey: false }))
			if (status.has_completed_survey) {
				throw redirect({ to: '/placement-test' })
			}
			throw redirect({ to: '/onboarding/role-selection' })
		}
	},
	component: LoginPage,
})