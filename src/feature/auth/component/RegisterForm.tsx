import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, User, Mail, AtSign, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { registerUser } from '../api/authAPI'

export function RegisterForm() {
	const navigate = useNavigate()
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [agreedToTerms, setAgreedToTerms] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)
	const [form, setForm] = useState({
		fullName: '',
		email: '',
		username: '',
		password: '',
		confirmPassword: '',
	})

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
		if (error) setError(null)
	}

	const isFormValid =
		form.fullName.trim() !== '' &&
		form.email.trim() !== '' &&
		form.username.trim() !== '' &&
		form.password.trim() !== '' &&
		form.confirmPassword.trim() !== '' &&
		agreedToTerms

	const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword
	const passwordsMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (form.password !== form.confirmPassword) {
			setError('Passwords do not match.')
			return
		}
		if (form.password.trim().length < 6) {
			setError('Password must be at least 6 characters long.')
			return
		}

		setIsLoading(true)
		setError(null)
		setSuccess(null)

		try {
			await registerUser({
				email: form.email.trim(),
				name: form.fullName.trim(),
				password: form.password,
				username: form.username.trim(),
			})
			setSuccess('Registration successful! Redirecting to sign in...')
			setTimeout(() => {
				navigate({ to: '/login' })
			}, 1200)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="w-full rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/60 dark:border-slate-800/90 shadow-2xl p-6 sm:p-9 transition-all duration-300">
			{/* Card Header */}
			<div className="mb-6 space-y-2">
				<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400">
					<span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
					<span>Join CareerPath</span>
				</div>
				<h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
					Create an Account
				</h1>
				<p className="text-sm text-slate-500 dark:text-slate-400">
					Start your personalized AI English path and advance your career today.
				</p>
			</div>

			{/* Error Banner */}
			{error && (
				<div
					role="alert"
					className="mb-5 flex items-start gap-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3.5 text-xs text-red-700 dark:text-red-400 animate-shake"
				>
					<AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
					<span className="leading-relaxed font-medium">{error}</span>
				</div>
			)}

			{/* Success Banner */}
			{success && (
				<div
					role="alert"
					className="mb-5 flex items-start gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-3.5 text-xs text-emerald-700 dark:text-emerald-400"
				>
					<CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
					<span className="leading-relaxed font-medium">{success}</span>
				</div>
			)}

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-4">
				{/* Full Name */}
				<div className="space-y-1.5">
					<label
						htmlFor="register-fullname"
						className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
					>
						Full Name
					</label>
					<div className="group relative flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 focus-within:border-indigo-500 dark:focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:focus-within:ring-indigo-400/15 transition-all duration-200 shadow-2xs overflow-hidden">
						<div className="flex h-11 w-11 items-center justify-center text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors">
							<User className="h-4 w-4" />
						</div>
						<input
							id="register-fullname"
							type="text"
							name="fullName"
							placeholder="Alex Johnson"
							value={form.fullName}
							onChange={handleChange}
							className="h-11 w-full bg-transparent pr-4 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden"
							autoComplete="name"
							required
						/>
					</div>
				</div>

				{/* Email + Username in a responsive 2-col row */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
					{/* Email */}
					<div className="space-y-1.5">
						<label
							htmlFor="register-email"
							className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
						>
							Email Address
						</label>
						<div className="group relative flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 focus-within:border-indigo-500 dark:focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:focus-within:ring-indigo-400/15 transition-all duration-200 shadow-2xs overflow-hidden">
							<div className="flex h-11 w-11 items-center justify-center text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors">
								<Mail className="h-4 w-4" />
							</div>
							<input
								id="register-email"
								type="email"
								name="email"
								placeholder="alex@company.com"
								value={form.email}
								onChange={handleChange}
								className="h-11 w-full bg-transparent pr-4 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden"
								autoComplete="email"
								required
							/>
						</div>
					</div>

					{/* Username */}
					<div className="space-y-1.5">
						<label
							htmlFor="register-username"
							className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
						>
							Username
						</label>
						<div className="group relative flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 focus-within:border-indigo-500 dark:focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:focus-within:ring-indigo-400/15 transition-all duration-200 shadow-2xs overflow-hidden">
							<div className="flex h-11 w-11 items-center justify-center text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors">
								<AtSign className="h-4 w-4" />
							</div>
							<input
								id="register-username"
								type="text"
								name="username"
								placeholder="alex21"
								value={form.username}
								onChange={handleChange}
								className="h-11 w-full bg-transparent pr-4 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden"
								autoComplete="username"
								required
							/>
						</div>
					</div>
				</div>

				{/* Password */}
				<div className="space-y-1.5">
					<div className="flex items-center justify-between">
						<label
							htmlFor="register-password"
							className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
						>
							Password
						</label>
						<span className="text-[11px] text-slate-400 dark:text-slate-500">Min. 6 characters</span>
					</div>
					<div className="group relative flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 focus-within:border-indigo-500 dark:focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:focus-within:ring-indigo-400/15 transition-all duration-200 shadow-2xs overflow-hidden">
						<div className="flex h-11 w-11 items-center justify-center text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors">
							<Lock className="h-4 w-4" />
						</div>
						<input
							id="register-password"
							type={showPassword ? 'text' : 'password'}
							name="password"
							placeholder="Create a strong password"
							value={form.password}
							onChange={handleChange}
							className="h-11 w-full bg-transparent pr-10 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden"
							autoComplete="new-password"
							required
						/>
						<button
							type="button"
							onClick={() => setShowPassword((v) => !v)}
							tabIndex={-1}
							className="absolute right-2.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					</div>
				</div>

				{/* Confirm Password */}
				<div className="space-y-1.5">
					<div className="flex items-center justify-between">
						<label
							htmlFor="register-confirm-password"
							className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
						>
							Confirm Password
						</label>
						{passwordsMatch && (
							<span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
								<CheckCircle2 className="h-3 w-3" /> Matched
							</span>
						)}
						{passwordsMismatch && (
							<span className="text-[11px] font-medium text-red-500">Not matching</span>
						)}
					</div>
					<div className="group relative flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 focus-within:border-indigo-500 dark:focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:focus-within:ring-indigo-400/15 transition-all duration-200 shadow-2xs overflow-hidden">
						<div className="flex h-11 w-11 items-center justify-center text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors">
							<Lock className="h-4 w-4" />
						</div>
						<input
							id="register-confirm-password"
							type={showConfirmPassword ? 'text' : 'password'}
							name="confirmPassword"
							placeholder="Re-enter password"
							value={form.confirmPassword}
							onChange={handleChange}
							className="h-11 w-full bg-transparent pr-10 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden"
							autoComplete="new-password"
							required
						/>
						<button
							type="button"
							onClick={() => setShowConfirmPassword((v) => !v)}
							tabIndex={-1}
							className="absolute right-2.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
							aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
						>
							{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					</div>
				</div>

				{/* Terms Checkbox */}
				<label
					htmlFor="register-terms-checkbox"
					className="flex items-start gap-3 cursor-pointer pt-1 select-none"
				>
					<input
						id="register-terms-checkbox"
						type="checkbox"
						checked={agreedToTerms}
						onChange={(e) => setAgreedToTerms(e.target.checked)}
						className="mt-0.5 h-4 w-4 rounded-md border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer accent-indigo-600"
					/>
					<span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
						I agree to the{' '}
						<a
							href="#"
							className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
							onClick={(e) => e.preventDefault()}
						>
							CareerPath Terms of Service
						</a>{' '}
						and acknowledge the privacy policy.
					</span>
				</label>

				{/* Submit Button */}
				<button
					id="register-submit-btn"
					type="submit"
					disabled={!isFormValid || isLoading}
					className="group relative w-full h-12 mt-2 rounded-xl font-semibold text-sm text-white shadow-lg shadow-indigo-500/25 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:via-blue-500 hover:to-indigo-500 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
				>
					{isLoading ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin text-white" />
							<span>Creating account...</span>
						</>
					) : (
						<>
							<span>Create Account</span>
							<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
						</>
					)}
				</button>
			</form>

			{/* Divider */}
			<div className="relative my-6 flex items-center justify-center">
				<div className="w-full border-t border-slate-200 dark:border-slate-800" />
				<span className="absolute bg-white dark:bg-slate-900 px-3 text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">
					Already a learner?
				</span>
			</div>

			{/* Login Link */}
			<div className="text-center">
				<p className="text-sm text-slate-600 dark:text-slate-400">
					Already have an account?{' '}
					<Link
						to="/login"
						className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors"
					>
						Sign In
					</Link>
				</p>
			</div>
		</div>
	)
}
