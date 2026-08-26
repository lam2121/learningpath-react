import { createFileRoute, redirect } from '@tanstack/react-router'
import { RegisterPage } from '@/feature/auth/page/RegisterPage'
import { fetchOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'
export const Route = createFileRoute('/(auth)/register')({
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
	component: RegisterPage,
})
