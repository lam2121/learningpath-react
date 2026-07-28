import { createFileRoute } from '@tanstack/react-router'
import { MilestonePage } from '@/feature/onboarding/page/MilestonePage'

// Public route — no session required (for testing purposes)
export const Route = createFileRoute('/milestone')({
	component: MilestonePage,
})
