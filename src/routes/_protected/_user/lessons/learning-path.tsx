import { createFileRoute, redirect } from '@tanstack/react-router'
import { CurriculumRoadmapPage } from '@/feature/learning-path/page/CurriculumRoadmapPage'
import { fetchOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'

function parseTopicId(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return undefined
}

export const Route = createFileRoute('/_protected/_user/lessons/learning-path')({
  validateSearch: (search: Record<string, unknown>) => {
    const topicId = parseTopicId(search.topicId)
    return topicId === undefined ? {} : { topicId }
  },
  beforeLoad: async () => {
    // Learner → check if placement test is finished
    const status = await fetchOnboardingStatus().catch(() => ({ learning_status: 'none' }))
    if (status.learning_status === 'enrolled') {
      throw redirect({ to: '/profile' })
    }
    throw redirect({ to: '/onboarding/role-selection' })
  },
  component: CurriculumRoadmapPage,
})
