import { createFileRoute } from '@tanstack/react-router'
import { PlacementResultPage } from '@/feature/onboarding/page/PlacementResultPage'

// Public route — no session required (for testing purposes)
export const Route = createFileRoute('/placement-result')({
	component: PlacementResultPage,
})
