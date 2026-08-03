import { createFileRoute } from '@tanstack/react-router'
import { CurriculumRoadmapPage } from '@/feature/learning-path/page/CurriculumRoadmapPage'
export const Route = createFileRoute('/_protected/_user/lessons/learning-path')({
  component: CurriculumRoadmapPage,
})

