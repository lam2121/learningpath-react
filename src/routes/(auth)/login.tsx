import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginPage } from '@/feature/auth/page/LoginPage'

export const Route = createFileRoute('/(auth)/login')({
	beforeLoad: ({ context }) => {
		if (context.auth.isAuthenticated) {
			throw redirect({ to: '/dashboard' })
		}
	},
	component: LoginPage,
})