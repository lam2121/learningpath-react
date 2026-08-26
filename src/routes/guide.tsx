import { createFileRoute } from '@tanstack/react-router'
import { GuidePage } from '@/common/page/GuidePage'

export const Route = createFileRoute('/guide')({
	component: GuidePage,
})
