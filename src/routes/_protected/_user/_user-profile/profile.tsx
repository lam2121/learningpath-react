import { createFileRoute, redirect } from '@tanstack/react-router'
import { UserProfile } from '@/feature/user-profile/page/user-profile'
import { fetchOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'

export const Route = createFileRoute('/_protected/_user/_user-profile/profile')({
  beforeLoad: async () => {
    // Learner → check if placement test is finished
    const status = await fetchOnboardingStatus().catch(() => ({ learning_status: 'none' }))
    if (status.learning_status === 'enrolled') {
      throw redirect({ to: '/profile' })
    }
    throw redirect({ to: '/onboarding/role-selection' })
  },
  component: UserProfile,
})


