import { createFileRoute } from '@tanstack/react-router'
import { LessonPage } from '@/feature/lesson-workspace/page/LessonPage'
export const Route = createFileRoute('/(auth)/lesson')({
  component: LessonPage,
})

