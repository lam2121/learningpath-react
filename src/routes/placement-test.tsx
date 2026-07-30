import { createFileRoute, redirect } from '@tanstack/react-router'
import { PlacementTestPage } from '@/feature/onboarding/page/PlacementTestPage'

export const Route = createFileRoute('/placement-test')({
	beforeLoad: ({ context }) => {
		if (context.auth.user?.role_id === 2) {
			throw redirect({ to: '/admin' })
		}
	},
	component: PlacementTestPage,
})
