import { createFileRoute, redirect } from '@tanstack/react-router'
import { DevAudioTestPage } from '@/feature/dev-mode/page/DevAudioTestPage'

export const Route = createFileRoute('/dev-audio-test')({
	beforeLoad: ({ context }) => {
		if (!context.auth.user) {
			throw redirect({ to: '/login' })
		}
	},
	component: DevAudioTestPage,
})
