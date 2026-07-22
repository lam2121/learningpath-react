import { createFileRoute } from '@tanstack/react-router'
import { MainPage } from '@/feature/learning-path/page/MainPage'

export const Route = createFileRoute('/_protected/_user/dashboard')({
	component: MainPage,
})
