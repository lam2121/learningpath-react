import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		// if (form.password !== form.confirmPassword) {
		// 	setError('Passwords do not match.')
		// 	return
		// }
		// if (form.password.length < 6) {
		// 	setError('Mật khẩu phải dài từ 6 ký tự')
		// 	return
		// }
		// const passwordRegex =
		// 	/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

		// if (!passwordRegex.test(form.password)) {
		// 	setError('Mật khẩu cần có ít nhất 1 chữ hoa, chữ thường và kí tự đặc biệt.')
		// 	return
		// }

		setIsLoading(true)
		setError(null)
		setSuccess(null)

		try {
			await registerUser({
				email: form.email,
				name: form.fullName,
				password: form.password,
			})
			await setSuccess('Đăng ký thành công')
			setTimeout(() => {
				navigate({ to: "/login" });
			}, 1000)
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
				{success && (
					<p className="register-success" role="alert">
						{success}
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
