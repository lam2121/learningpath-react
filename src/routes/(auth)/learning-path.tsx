import { createFileRoute } from '@tanstack/react-router'
import { CurriculumRoadmapPage } from '@/feature/learning-path/page/CurriculumRoadmapPage'
export const Route = createFileRoute('/(auth)/learning-path')({
  component: CurriculumRoadmapPage,
})

