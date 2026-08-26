import { createFileRoute, redirect } from '@tanstack/react-router'
import { RegisterPage } from '@/feature/auth/page/RegisterPage'
import { fetchOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'
export const Route = createFileRoute('/(auth)/register')({
	beforeLoad: async () => {
		// Learner → check if placement test is finished
		const status = await fetchOnboardingStatus().catch(() => ({ learning_status: 'none' }))
		if (status.learning_status === 'enrolled') {
			throw redirect({ to: '/profile' })
		}
		throw redirect({ to: '/onboarding/role-selection' })
	},
	component: RegisterPage,
})
