import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, User, Lock } from 'lucide-react'
import { FacebookIcon, GoogleIcon } from '@/common/component/SocialMediaIcon'
import { loginUser } from '../api/authAPI'
import { saveUserSession } from '../helper/authHelper'
import { useAuth } from '@/common/context/AuthContext'
import { fetchOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'

// GitHub icon (not in SocialMediaIcon.tsx, add inline)
const GithubIcon = ({ className }: { className?: string }) => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`w-4 h-4 ${className ?? ''}`}>
		<path
			d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
			fill="currentColor"
		/>
	</svg>
)
export function LoginForm() {
	const navigate = useNavigate()
	const { refreshAuth } = useAuth()
	const [showPassword, setShowPassword] = useState(false)
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		setError(null)

		try {
			// 1. Call the API
			const data = await loginUser({ identifier: username, password })

			// 2. Persist token + user info from login response
			saveUserSession({
				access_token: data.access_token,
				email: data.email,
				username: data.name,
				role_id: data.role_id,
				user_id: data.user_id,
				name: data.name,
			})

			// 3. Sync AuthContext so the rest of the app sees the logged-in user
			await refreshAuth()

			// 4. Redirect based on role
			if (data.role_id === 2) {
				// Admin → go to admin dashboard
				await navigate({ to: '/admin' })
				return
			}

			// Learner → check onboarding status
			const status = await fetchOnboardingStatus().catch(() => ({ has_completed_survey: false }))

			if (status.has_completed_survey) {
				await navigate({ to: '/placement-test' })
			} else {
				await navigate({ to: '/onboarding/role-selection' })
			}

		} catch (err) {
			setError(err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="login-card">
			{/* Logo */}
			<div className="login-logo">
				<span className="logo-text">CareerPath</span>
				<div className="logo-underline" />
			</div>
			{/* Title */}
			<h1 className="login-title">Đăng nhập vào CareerPath</h1>
			{/* Form */}
			<form onSubmit={handleSubmit} className="login-form">
				{/* Username / Email */}
				<div className="login-input-wrapper">
					<span className="login-input-icon">
						<User size={16} className="icon-muted" />
					</span>
					<input
						id="login-username"
						type="text"
						placeholder="Tên người dùng hoặc email"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						className="login-input"
						autoComplete="username"
					/>
				</div>
				{/* Password */}
				<div className="login-input-wrapper">
					<span className="login-input-icon">
						<Lock size={16} className="icon-muted" />
					</span>
					<input
						id="login-password"
						type={showPassword ? 'text' : 'password'}
						placeholder="Mật khẩu"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="login-input"
						autoComplete="current-password"
					/>
					<button
						type="button"
						className="login-eye-btn"
						onClick={() => setShowPassword((v) => !v)}
						tabIndex={-1}
						aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
					>
						{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
					</button>
				</div>
				{/* Error message */}
				{error && (
					<p className="register-error" role="alert">
						{error}
					</p>
				)}
				{/* Submit */}
				<button
					id="login-submit-btn"
					type="submit"
					className={`login-btn${isLoading ? ' login-btn--loading' : ''}`}
					disabled={isLoading}
				>
					{isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
				</button>
			</form>
			{/* Links */}
			<div className="login-links">
				<Link to="/forgot-password" className="login-link">
					Quên mật khẩu?
				</Link>
				<Link to="/register" className="login-link">
					Tạo tài khoản
				</Link>
			</div>
			{/* Divider */}
			<div className="login-divider">
				<span>Đăng nhập bằng</span>
			</div>
			{/* Social Buttons */}
			<div className="login-social-grid">
				<button id="login-facebook-btn" type="button" className="login-social-btn">
					<FacebookIcon className="social-icon facebook-icon" />
					<span>Facebook</span>
				</button>
				<button id="login-google-btn" type="button" className="login-social-btn">
					<GoogleIcon className="social-icon google-icon" />
					<span>Google</span>
				</button>
				<button id="login-github-btn" type="button" className="login-social-btn">
					<GithubIcon className="social-icon github-icon" />
					<span>Github</span>
				</button>
			</div>
		</div>
	)
}