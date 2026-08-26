import { createFileRoute, redirect } from '@tanstack/react-router'
import { ForgotPassPage } from '@/feature/auth/page/ForgotPassPage'
import { fetchOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'

export const Route = createFileRoute('/(auth)/forgot-password')({
	beforeLoad: async ({ context }) => {
		if (!context.auth.isAuthenticated) return

		if (context.auth.user?.role_id === 2) {
			throw redirect({ to: '/admin' })
		}

		const status = await fetchOnboardingStatus().catch(() => ({ learning_status: 'none' }))
		if (status.learning_status === 'enrolled') {
			throw redirect({ to: '/profile' })
		}
		throw redirect({ to: '/onboarding/role-selection' })
	},
	component: ForgotPassPage,
})
