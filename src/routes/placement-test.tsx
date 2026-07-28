import { createFileRoute } from '@tanstack/react-router'
import { PlacementTestPage } from '@/feature/onboarding/page/PlacementTestPage'

// Public route — no session required (for testing purposes)
export const Route = createFileRoute('/placement-test')({
	component: PlacementTestPage,
})
