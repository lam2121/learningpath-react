import { createFileRoute } from '@tanstack/react-router'
import { CurriculumRoadmapPage } from '@/feature/learning-path/page/CurriculumRoadmapPage'

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
  component: CurriculumRoadmapPage,
})
