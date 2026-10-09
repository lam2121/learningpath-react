import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/common/context/AuthContext'
import {
  saveUserSession,
  getAccessToken,
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  ADMIN_ROLE_ID,
  LEARNER_ROLE_ID,
} from '@/feature/auth/helper/authHelper'
import { fetchOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'
import { recordLoginDay } from '@/common/utils/StudyActivity'

export const Route = createFileRoute('/(auth)/sso-callback')({
  component: CareerPathSSOCallbackRoute,
})

/**
 * CareerPath SSO Callback Route.
 *
 * Receives authentication tokens from the Centralized Portal via URL hash fragment.
 */
function CareerPathSSOCallbackRoute() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [error, setError] = useState<string | null>(null)
  const isHandledRef = useRef(false)

  useEffect(() => {
    // Prevent React StrictMode from executing this twice and reading empty hash on 2nd run
    if (isHandledRef.current) return
    isHandledRef.current = true

    async function handleCallback() {
      try {
        const hash = window.location.hash.substring(1)
        if (!hash) {
          // If already authenticated, do not show error
          if (getAccessToken()) return
          setError('Không nhận được thông tin xác thực từ Cổng Đăng Nhập.')
          return
        }

        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const userRaw = params.get('user')

        if (!accessToken) {
          if (getAccessToken()) return
          setError('Token không hợp lệ từ Cổng Đăng Nhập.')
          return
        }

        // Save tokens immediately into localStorage so subsequent requests have them
        localStorage.setItem(TOKEN_KEY, accessToken)
        if (refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
        }

        let parsedUser: any = {}
        if (userRaw) {
          try {
            parsedUser = JSON.parse(decodeURIComponent(userRaw))
          } catch {
            console.warn('Could not parse user info from hash')
          }
        }

        const isAdmin =
          parsedUser.role === 'admin' ||
          parsedUser.role === 'administrator' ||
          parsedUser.role_id === ADMIN_ROLE_ID ||
          parsedUser.role_id === String(ADMIN_ROLE_ID)

        const roleId = isAdmin ? ADMIN_ROLE_ID : LEARNER_ROLE_ID

        // Save session in CareerPath localStorage format
        saveUserSession({
          access_token: accessToken,
          user_id: parsedUser.id || 0,
          email: parsedUser.email || '',
          username: parsedUser.username || parsedUser.name || '',
          name: parsedUser.username || parsedUser.name || '',
          role: isAdmin ? 'admin' : 'employee',
          role_id: roleId,
        })

        // Clean up hash from URL
        window.history.replaceState(null, '', window.location.pathname)

        // Refresh Auth Context to fetch canonical CareerPath profile & role
        const serverUser = await auth.refreshAuth()

        if (parsedUser.id) {
          recordLoginDay(Number(parsedUser.id))
        }

        // Navigate based on role (prefer canonical role_id from CareerPath)
        const finalRoleId = serverUser?.role_id ?? roleId
        if (finalRoleId === ADMIN_ROLE_ID) {
          localStorage.removeItem('pending_role_id')
          localStorage.removeItem('pending_survey_answers')
          await navigate({ to: '/admin', replace: true })
          return
        }

        const status = await fetchOnboardingStatus().catch(() => ({ learning_status: 'none' }))
        if (status.learning_status === 'enrolled') {
          await navigate({ to: '/profile', replace: true })
        } else {
          await navigate({ to: '/onboarding/role-selection', replace: true })
        }
      } catch (err) {
        console.error('CareerPath SSO callback error:', err)
        setError('Đã có lỗi xảy ra khi hoàn tất đăng nhập.')
      }
    }

    handleCallback()
  }, [])

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        background: '#f0f4f9',
      }}>
        <div style={{
          padding: '1.5rem 2rem',
          background: '#FEF2F2',
          border: '1px solid #F87171',
          borderRadius: '8px',
          color: '#B91C1C',
          maxWidth: '420px',
          textAlign: 'center',
          fontSize: '14px',
        }}>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Đăng nhập không thành công</p>
          <p>{error}</p>
        </div>
        <button
          onClick={() => navigate({ to: '/login', replace: true })}
          style={{
            padding: '0.6rem 1.5rem',
            background: '#3b9be8',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Quay lại Đăng nhập
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem',
      background: '#f0f4f9',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #d0d7e2',
        borderTopColor: '#3b9be8',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
      }} />
      <p style={{ color: '#555', fontSize: '0.95rem' }}>Đang xác thực và chuyển hướng...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
