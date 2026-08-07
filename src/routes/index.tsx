<<<<<<< HEAD
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	beforeLoad: () => {
		throw redirect({ to: '/login' })
	},
	component: () => null,
=======
import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/common/page/HomePage'
export const Route = createFileRoute('/')({
  component: HomePage,
>>>>>>> 79e5a44655c941fd4c13b0acc8687ef1a1d14dfe
})
