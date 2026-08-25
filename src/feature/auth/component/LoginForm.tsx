import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, User, Lock } from 'lucide-react'
import { loginUser } from '../api/authAPI'
import { saveUserSession } from '../helper/authHelper'
import { useAuth } from '@/common/context/AuthContext'
import { fetchOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'
import {
	clearAnonymousPlacementAttempt,
	clearPlacementMode,
	syncAnonymousPlacementAttempt,
} from '@/feature/onboarding/anonymousPlacement'

import { recordLoginDay } from "@/feature/user-profile/utils/StudyActivity";
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
				clearAnonymousPlacementAttempt()
				clearPlacementMode()
				localStorage.removeItem('pending_role_id')
				localStorage.removeItem('pending_survey_answers')
				await navigate({ to: '/admin' })
				return
			}

			const anonymousSyncState = await syncAnonymousPlacementAttempt()
			if (anonymousSyncState === 'saved') {
				await navigate({ to: '/placement-result' })
				return
			}

			if (anonymousSyncState === 'already_exists') {
				window.alert('This account already has a saved placement test score. Your anonymous result was not applied.')
			}

			// Learner → check if placement test is finished
			const status = await fetchOnboardingStatus().catch(() => ({ learning_status: 'none' }))
			recordLoginDay(Number(data.user_id));
			if (status.learning_status === 'enrolled') {
				await navigate({ to: '/profile' })
			} else {
				await navigate({ to: '/onboarding/role-selection' })
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
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
			<h1 className="login-title">Sign in to CareerPath</h1>
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
						placeholder="Username or email"
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
						placeholder="Password"
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
						aria-label={showPassword ? 'Hide password' : 'Show password'}
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
					{isLoading ? 'Signing in...' : 'Sign In'}
				</button>
			</form>
			<div>
				<br />

			</div>
			{/* Links */}
			<div className="login-links">
				<Link to="/forgot-password" className="login-link">
					Forgot password?
				</Link>
				<Link to="/register" className="login-link">
					Create account
				</Link>
			</div>

		</div>
	)
}
