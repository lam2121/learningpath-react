import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginPage } from '@/feature/auth/page/LoginPage'
import { fetchOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'

export const Route = createFileRoute('/(auth)/login')({
	beforeLoad: async ({ context }) => {
		if (context.auth.isAuthenticated) {
			const status = await fetchOnboardingStatus().catch(() => ({ has_completed_survey: false, is_finished_placement_test: false }))
			if (status.is_finished_placement_test) {
				throw redirect({ to: '/dashboard' })
			}
			throw redirect({ to: '/onboarding/role-selection' })
		}
	},
	component: LoginPage,
})