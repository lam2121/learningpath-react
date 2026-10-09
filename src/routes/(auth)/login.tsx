import { createFileRoute, redirect, isRedirect } from '@tanstack/react-router'
import { useEffect } from 'react'
import { getAppPath } from '@/const/appConst'
import { ADMIN_ROLE_ID } from '@/feature/auth/helper/authHelper'
import { fetchOnboardingStatus, getCachedOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'

export const Route = createFileRoute('/(auth)/login')({
	beforeLoad: async ({ context }) => {
		if (context.auth.isAuthenticated) {
			const role_id = context.auth.user?.role_id

			// Admin → redirect to admin dashboard
			if (role_id === ADMIN_ROLE_ID) {
				throw redirect({ to: '/admin' })
			}

			// Learner → check if placement test is finished
			try {
				const status = await fetchOnboardingStatus()
				if (status.learning_status === 'enrolled') {
					throw redirect({ to: '/profile' })
				}
				throw redirect({ to: '/onboarding/role-selection' })
			} catch (err) {
				if (isRedirect(err)) {
					throw err
				}
				const userId = context.auth.user?.id ? Number(context.auth.user.id) : null
				const cachedStatus = getCachedOnboardingStatus(userId)
				if (cachedStatus === 'none') {
					throw redirect({ to: '/onboarding/role-selection' })
				}
				// Default to profile on network error so existing users aren't sent to onboarding
				throw redirect({ to: '/profile' })
			}
		}
	},
	component: CareerPathLoginRedirectComponent,
})

function CareerPathLoginRedirectComponent() {
	useEffect(() => {
		const redirectUri = encodeURIComponent(window.location.origin + getAppPath('/sso-callback'))
		let portalUrl: string
		if (import.meta.env.VITE_AUTH_PORTAL_URL) {
			const baseUrl = import.meta.env.VITE_AUTH_PORTAL_URL.replace(/\/login\/?$/, '')
			portalUrl = `${baseUrl}/login?redirect_uri=${redirectUri}&app=careerpath`
		} else if (import.meta.env.VITE_AUTH_API_URL && !import.meta.env.VITE_AUTH_API_URL.startsWith('/')) {
			const baseUrl = import.meta.env.VITE_AUTH_API_URL.replace(/\/login\/?$/, '')
			portalUrl = `${baseUrl}/login?redirect_uri=${redirectUri}&app=careerpath`
		} else {
			// Trên Production Server: Gọi qua /api/auth/login đã được Nginx reverse proxy sẵn
			portalUrl = `${window.location.origin}/api/auth/login?redirect_uri=${redirectUri}&app=careerpath`
		}
		window.location.href = portalUrl
	}, [])

	return (
		<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f9' }}>
			<p style={{ color: '#666', fontSize: '14px' }}>Đang chuyển hướng sang Cổng Đăng Nhập...</p>
		</div>
	)
}

