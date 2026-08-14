import { createFileRoute } from '@tanstack/react-router'
import { LessonPage } from '@/feature/lesson-workspace/page/LessonPage'

export const Route = createFileRoute('/_protected/_user/lessons/$lessonId')({
	component: LessonRoute,
})

function LessonRoute() {
	const { lessonId } = Route.useParams()
	return <LessonPage lessonId={Number(lessonId)} />
}
