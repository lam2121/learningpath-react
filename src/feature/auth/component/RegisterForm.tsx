import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { registerUser } from '../api/authAPI'

const GithubIcon = ({ className }: { className?: string }) => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`w-4 h-4 ${className ?? ''}`}>
		<path
			d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
			fill="currentColor"
		/>
	</svg>
)

export function RegisterForm() {
	const navigate = useNavigate()
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [agreedToTerms, setAgreedToTerms] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (form.password !== form.confirmPassword) {
			setError('Passwords do not match.')
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			await registerUser({
				email: form.email,
				name: form.fullName,
				password: form.password,
			})
			// Đăng ký thành công → chuyển hướng sang trang đăng nhập
			await navigate({ to: '/login' })
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="register-card">
			{/* Logo */}
			<div className="login-logo">
				<span className="logo-text">CareerPath</span>
				<div className="logo-underline" />
			</div>

			{/* Title */}
			<h1 className="register-title">Create a CareerPath account</h1>

			{/* Welcome text */}
			<p className="register-welcome">
				Welcome to the{' '}
				<strong className="register-welcome-highlight">CareerPath Platform!</strong>{' '}
				Join us to find the information you need to improve your English skills at work.
				Please fill in your details below to continue.
			</p>

			{/* Form */}
			<form onSubmit={handleSubmit} className="register-form">
				{/* Full Name */}
				<input
					id="register-fullname"
					type="text"
					name="fullName"
					placeholder="Your full name"
					value={form.fullName}
					onChange={handleChange}
					className="register-input"
					autoComplete="name"
				/>

				{/* Email + Username side by side */}
				<div className="register-row">
					<input
						id="register-email"
						type="email"
						name="email"
						placeholder="Your email address"
						value={form.email}
						onChange={handleChange}
						className="register-input"
						autoComplete="email"
					/>
					<input
						id="register-username"
						type="text"
						name="username"
						placeholder="Username"
						value={form.username}
						onChange={handleChange}
						className="register-input"
						autoComplete="username"
					/>
				</div>

				{/* Password */}
				<div className="register-input-wrapper">
					<input
						id="register-password"
						type={showPassword ? 'text' : 'password'}
						name="password"
						placeholder="Password"
						value={form.password}
						onChange={handleChange}
						className="register-input"
						autoComplete="new-password"
					/>
					<button
						type="button"
						className="register-eye-btn"
						onClick={() => setShowPassword((v) => !v)}
						tabIndex={-1}
						aria-label={showPassword ? 'Hide password' : 'Show password'}
					>
						{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
					</button>
				</div>

				{/* Confirm Password */}
				<div className="register-input-wrapper">
					<input
						id="register-confirm-password"
						type={showConfirmPassword ? 'text' : 'password'}
						name="confirmPassword"
						placeholder="Confirm your password"
						value={form.confirmPassword}
						onChange={handleChange}
						className="register-input"
						autoComplete="new-password"
					/>
					<button
						type="button"
						className="register-eye-btn"
						onClick={() => setShowConfirmPassword((v) => !v)}
						tabIndex={-1}
						aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
					>
						{showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
					</button>
				</div>

				{/* Terms Checkbox */}
				<label className="register-terms" htmlFor="register-terms-checkbox">
					<input
						id="register-terms-checkbox"
						type="checkbox"
						checked={agreedToTerms}
						onChange={(e) => setAgreedToTerms(e.target.checked)}
						className="register-checkbox"
					/>
					<span>
						I agree to the{' '}
						<a href="#" className="register-terms-link">
							CareerPath Terms of Service
						</a>
					</span>
				</label>

				{/* Error message */}
				{error && (
					<p className="register-error" role="alert">
						{error}
					</p>
				)}

				{/* Submit */}
				<button
					id="register-submit-btn"
					type="submit"
					className={`register-btn${isFormValid && !isLoading ? '' : ' register-btn--disabled'}`}
					disabled={!isFormValid || isLoading}
				>
					{isLoading ? 'Creating account...' : 'Create Account'}
				</button>
			</form>
					 <div>
			 <br />

			</div>

			{/* Login link */}
			<p className="register-login-prompt">
				Already have an account?{' '}
				<Link to="/login" className="login-link">
					Sign In
				</Link>
			</p>
		</div>
	)
}
