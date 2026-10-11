import { createFileRoute, redirect, isRedirect } from '@tanstack/react-router'
import { LoginPage } from '@/feature/auth/page/LoginPage'
import { ADMIN_ROLE_ID } from '@/feature/auth/helper/authHelper'
import { fetchOnboardingStatus, getCachedOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'

export const Route = createFileRoute('/(auth)/login')({
	beforeLoad: async ({ context }) => {
		if (context.auth.isAuthenticated) {
			const role_id = context.auth.user?.role_id

			// Admin → redirect to admin dashboard
			if (role_id === ADMIN_ROLE_ID) {
				throw redirect({ to: '/admin' })
			}

			// Learner → check if placement test is finished
			try {
				const status = await fetchOnboardingStatus()
				if (status.learning_status === 'enrolled') {
					throw redirect({ to: '/profile' })
				}
				throw redirect({ to: '/onboarding/role-selection' })
			} catch (err) {
				if (isRedirect(err)) {
					throw err
				}
				const userId = context.auth.user?.id ? Number(context.auth.user.id) : null
				const cachedStatus = getCachedOnboardingStatus(userId)
				if (cachedStatus === 'none') {
					throw redirect({ to: '/onboarding/role-selection' })
				}
				// Default to profile on network error so existing users aren't sent to onboarding
				throw redirect({ to: '/profile' })
			}
		}
	},
	component: LoginPage,
})

