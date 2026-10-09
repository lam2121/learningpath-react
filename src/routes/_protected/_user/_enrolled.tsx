import { createFileRoute, redirect, Outlet, isRedirect } from '@tanstack/react-router'
import { fetchOnboardingStatus, getCachedOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'
import { DailyMorningReviewAutoTrigger } from '@/feature/daily-review'

export const Route = createFileRoute('/_protected/_user/_enrolled')({
	beforeLoad: async ({ context }) => {
		try {
			const status = await fetchOnboardingStatus()
			if (status.learning_status !== 'enrolled') {
				throw redirect({ to: '/onboarding/role-selection' })
			}
		} catch (err) {
			if (isRedirect(err)) {
				throw err
			}
			// Server is unreachable or experienced a transient network error.
			// Differentiate infrastructure failure from legitimate "not enrolled" business state.
			const userId = context.auth?.user?.id ? Number(context.auth.user.id) : null
			const cachedStatus = getCachedOnboardingStatus(userId)
			if (cachedStatus === 'none') {
				throw redirect({ to: '/onboarding/role-selection' })
			}
			console.warn('Cannot reach server to verify onboarding status; preserving enrolled view.', err)
		}
	},
	component: () => (
		<>
			<Outlet />
			<DailyMorningReviewAutoTrigger />
		</>
	),
})

