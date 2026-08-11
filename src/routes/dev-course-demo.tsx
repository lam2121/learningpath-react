import { createFileRoute, redirect } from '@tanstack/react-router'
import { DevCourseDemoPage } from '@/feature/dev-mode/page/DevCourseDemoPage'

export const Route = createFileRoute('/dev-course-demo')({
	beforeLoad: ({ context }) => {
		if (!context.auth.user) {
			throw redirect({ to: '/login' })
		}
	},
	component: DevCourseDemoPage,
})
