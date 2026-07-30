import { createFileRoute, redirect } from '@tanstack/react-router'
import { PlacementResultPage } from '@/feature/onboarding/page/PlacementResultPage'

export const Route = createFileRoute('/placement-result')({
	beforeLoad: ({ context }) => {
		if (context.auth.user?.role_id === 2) {
			throw redirect({ to: '/admin' })
		}
	},
	component: PlacementResultPage,
})
