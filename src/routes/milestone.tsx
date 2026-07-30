import { createFileRoute, redirect } from '@tanstack/react-router'
import { MilestonePage } from '@/feature/onboarding/page/MilestonePage'

export const Route = createFileRoute('/milestone')({
	beforeLoad: ({ context }) => {
		if (context.auth.user?.role_id === 2) {
			throw redirect({ to: '/admin' })
		}
	},
	component: MilestonePage,
})
