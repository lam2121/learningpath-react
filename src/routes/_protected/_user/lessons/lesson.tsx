import { createFileRoute } from '@tanstack/react-router'
import { LessonPage } from '@/feature/lesson-workspace/page/LessonPage'
export const Route = createFileRoute('/_protected/_user/lessons/lesson')({
  component: LessonPage,
})

