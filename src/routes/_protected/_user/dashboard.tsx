import { createFileRoute } from '@tanstack/react-router'
import { CourseLoading } from '@/feature/onboarding/component/CourseLoading'
export const Route = createFileRoute('/_protected/_user/dashboard')({
	component: CourseLoading,
})
