import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, User, Lock, ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react'
import { loginUser } from '../api/authAPI'
import { saveUserSession } from '../helper/authHelper'
import { useAuth } from '@/common/context/AuthContext'
import { fetchOnboardingStatus, getCachedOnboardingStatus } from '@/feature/onboarding/api/onboardingApi'
import { recordLoginDay } from '@/feature/user-profile/utils/StudyActivity'

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
		if (!username.trim() || !password) {
			setError('Username/email và mật khẩu là bắt buộc.')
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			// 1. Call the Central Auth Service API
			const data = await loginUser({ identifier: username.trim(), password })

			// 2. Persist user session info
			saveUserSession({
				email: data.email,
				username: data.name,
				role_id: data.role_id,
				user_id: data.user_id,
				name: data.name,
			})

			// 3. Refresh AuthContext so app state synchronizes immediately
			await refreshAuth()

			// 4. Role redirection
			const roleId = Number(data.role_id)
			if (roleId === 2) {
				localStorage.removeItem('pending_role_id')
				localStorage.removeItem('pending_survey_answers')
				await navigate({ to: '/admin' })
				return
			}

			// Learner → check if placement test is completed
			recordLoginDay(Number(data.user_id))
			try {
				const status = await fetchOnboardingStatus()
				if (status.learning_status === 'enrolled') {
					await navigate({ to: '/profile' })
				} else {
					await navigate({ to: '/onboarding/role-selection' })
				}
			} catch {
				const cachedStatus = getCachedOnboardingStatus(Number(data.user_id))
				if (cachedStatus === 'none') {
					await navigate({ to: '/onboarding/role-selection' })
				} else {
					await navigate({ to: '/profile' })
				}
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="w-full rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-slate-900/95 sm:bg-white/90 sm:dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 sm:border-white/60 sm:dark:border-slate-800/90 shadow-xl sm:shadow-2xl p-5 sm:p-9 transition-all duration-300">
			{/* Card Header */}
			<div className="mb-4 sm:mb-6 space-y-1 sm:space-y-2">
				<div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 text-blue-600 dark:text-blue-400">
					<span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
					<span>Secure Sign In</span>
				</div>
				<h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
					Welcome back
				</h1>
				<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
					Enter your credentials to continue your AI English learning path.
				</p>
			</div>

			{/* Error Banner */}
			{error && (
				<div
					role="alert"
					className="mb-3.5 sm:mb-5 flex items-start gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3 text-xs text-red-700 dark:text-red-400 animate-shake"
				>
					<AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
					<span className="leading-relaxed font-medium">{error}</span>
				</div>
			)}

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
				{/* Username / Email Field */}
				<div className="space-y-1">
					<label
						htmlFor="login-username"
						className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
					>
						Username or Email
					</label>
					<div className="group relative flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-3 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-400/15 transition-all duration-200 shadow-2xs overflow-hidden">
						<div className="flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
							<User className="h-4 w-4" />
						</div>
						<input
							id="login-username"
							type="text"
							placeholder="username or user@company.com"
							value={username}
							onChange={(e) => {
								setUsername(e.target.value)
								if (error) setError(null)
							}}
							className="h-10 sm:h-11 w-full bg-transparent pr-4 text-base sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden"
							autoComplete="username"
							required
						/>
					</div>
				</div>

				{/* Password Field */}
				<div className="space-y-1">
					<div className="flex items-center justify-between">
						<label
							htmlFor="login-password"
							className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
						>
							Password
						</label>
						<Link
							to="/forgot-password"
							className="text-[11px] sm:text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
						>
							Forgot password?
						</Link>
					</div>
					<div className="group relative flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-3 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-400/15 transition-all duration-200 shadow-2xs overflow-hidden">
						<div className="flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
							<Lock className="h-4 w-4" />
						</div>
						<input
							id="login-password"
							type={showPassword ? 'text' : 'password'}
							placeholder="••••••••"
							value={password}
							onChange={(e) => {
								setPassword(e.target.value)
								if (error) setError(null)
							}}
							className="h-10 sm:h-11 w-full bg-transparent pr-10 text-base sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden"
							autoComplete="current-password"
							required
						/>
						<button
							type="button"
							onClick={() => setShowPassword((v) => !v)}
							tabIndex={-1}
							className="absolute right-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					</div>
				</div>

				{/* Submit Button */}
				<button
					id="login-submit-btn"
					type="submit"
					disabled={!username.trim() || !password || isLoading}
					className="group relative w-full h-11 sm:h-12 mt-1 sm:mt-2 rounded-xl font-semibold text-sm text-white shadow-lg shadow-blue-500/25 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
				>
					{isLoading ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin text-white" />
							<span>Signing in...</span>
						</>
					) : (
						<>
							<span>Sign In</span>
							<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
						</>
					)}
				</button>
			</form>

			{/* Divider */}
			<div className="relative my-3.5 sm:my-6 flex items-center justify-center">
				<div className="w-full border-t border-slate-200 dark:border-slate-800" />
				<span className="absolute bg-white dark:bg-slate-900 px-3 text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">
					or
				</span>
			</div>

			{/* Register CTA */}
			<div className="text-center space-y-2 sm:space-y-3">
				<p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
					Don&apos;t have an account yet?{' '}
					<Link
						to="/register"
						className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
					>
						Create account
					</Link>
				</p>

				<div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">
					<ShieldCheck className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-emerald-500" />
					<span>Single Sign-On & JWT encrypted session</span>
				</div>
			</div>
		</div>
	)
}
