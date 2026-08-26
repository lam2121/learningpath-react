import { createFileRoute, redirect } from '@tanstack/react-router'
import { UserProfile } from '@/feature/user-profile/page/user-profile'
import { fetchOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'

export const Route = createFileRoute('/_protected/_user/_user-profile/profile')({
  beforeLoad: async () => {
    const status = await fetchOnboardingStatus().catch(() => ({ learning_status: 'none' }))
    if (status.learning_status !== 'enrolled') {
      throw redirect({ to: '/onboarding/role-selection' })
    }
  },
  component: UserProfile,
})


