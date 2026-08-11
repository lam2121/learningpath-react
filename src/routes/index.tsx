import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/common/page/HomePage'
export const Route = createFileRoute('/')({
	component: HomePage,
})
