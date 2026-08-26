import { createFileRoute, redirect } from '@tanstack/react-router'
import { GuidePage } from '@/common/page/GuidePage'
import { fetchOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'

export const Route = createFileRoute('/guide')({
  beforeLoad: async () => {
    // Learner → check if placement test is finished
    const status = await fetchOnboardingStatus().catch(() => ({ learning_status: 'none' }))
    if (status.learning_status === 'enrolled') {
      throw redirect({ to: '/profile' })
    }
    throw redirect({ to: '/onboarding/role-selection' })
  },
  component: GuidePage,
})

