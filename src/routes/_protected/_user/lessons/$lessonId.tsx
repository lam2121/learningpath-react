import { createFileRoute, redirect } from '@tanstack/react-router'
import { LessonPage } from '@/feature/lesson-workspace/page/LessonPage'
import { fetchOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'

export const Route = createFileRoute('/_protected/_user/lessons/$lessonId')({
	beforeLoad: async () => {
		// Learner → check if placement test is finished
		const status = await fetchOnboardingStatus().catch(() => ({ learning_status: 'none' }))
		if (status.learning_status === 'enrolled') {
			throw redirect({ to: '/profile' })
		}
		throw redirect({ to: '/onboarding/role-selection' })
	},
	component: LessonRoute,
})

function LessonRoute() {
	const { lessonId } = Route.useParams()
	return <LessonPage lessonId={Number(lessonId)} />
}
