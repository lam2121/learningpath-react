import { createFileRoute } from '@tanstack/react-router'
import { RegisterPage } from '@/feature/auth/page/RegisterPage'

export const Route = createFileRoute('/(auth)/register')({
	component: RegisterPage,
})
