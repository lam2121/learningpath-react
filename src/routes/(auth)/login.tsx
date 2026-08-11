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

			// Learner → check if placement test is finished
			const status = await fetchOnboardingStatus().catch(() => ({ learning_status: 'none' }))
			if (status.learning_status === 'enrolled') {
				throw redirect({ to: '/profile' })
			}
			throw redirect({ to: '/onboarding/role-selection' })
		}
	},
	component: LoginPage,
})
