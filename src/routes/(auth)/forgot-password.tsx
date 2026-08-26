import { createFileRoute } from '@tanstack/react-router'
import { ForgotPassPage } from '@/feature/auth/page/ForgotPassPage'

export const Route = createFileRoute('/(auth)/forgot-password')({
	component: ForgotPassPage,
})
