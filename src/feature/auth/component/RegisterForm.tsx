import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { FacebookIcon, GoogleIcon } from '@/common/component/SocialMediaIcon'
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
			setError('Mật khẩu xác nhận không khớp.')
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
			setError(err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.')
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
			<h1 className="register-title">Đăng ký tài khoản cho CareerPath</h1>

			{/* Welcome text */}
			<p className="register-welcome">
				Chào mừng bạn đến{' '}
				<strong className="register-welcome-highlight">Nền tảng CareerPath!</strong>{' '}
				Tham gia cùng chúng tôi để tìm kiếm thông tin hữu ích cần thiết để cải thiện kỹ năng Tiếng Anh trong công việc của bạn.
				Vui lòng điền thông tin của bạn vào biểu mẫu bên dưới để tiếp tục.
			</p>

			{/* Form */}
			<form onSubmit={handleSubmit} className="register-form">
				{/* Full Name */}
				<input
					id="register-fullname"
					type="text"
					name="fullName"
					placeholder="Tên của bạn"
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
						placeholder="Địa chỉ email của bạn"
						value={form.email}
						onChange={handleChange}
						className="register-input"
						autoComplete="email"
					/>
					<input
						id="register-username"
						type="text"
						name="username"
						placeholder="Tên tài khoản"
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
						placeholder="Mật khẩu"
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
						aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
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
						placeholder="Xác nhận mật khẩu của bạn"
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
						aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
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
						Tôi đồng ý{' '}
						<a href="#" className="register-terms-link">
							Điều khoản dịch vụ của CareerPath
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
					{isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
				</button>
			</form>

			{/* Divider */}
			<div className="login-divider">
				<span>Đăng nhập với</span>
			</div>

			{/* Social Buttons */}
			<div className="login-social-grid">
				<button id="register-facebook-btn" type="button" className="login-social-btn">
					<FacebookIcon className="social-icon facebook-icon" />
					<span>Facebook</span>
				</button>
				<button id="register-google-btn" type="button" className="login-social-btn">
					<GoogleIcon className="social-icon google-icon" />
					<span>Google</span>
				</button>
				<button id="register-github-btn" type="button" className="login-social-btn">
					<GithubIcon className="social-icon github-icon" />
					<span>Github</span>
				</button>
			</div>

			{/* Login link */}
			<p className="register-login-prompt">
				Đã có tài khoản?{' '}
				<Link to="/login" className="login-link">
					Đăng nhập
				</Link>
			</p>
		</div>
	)
}
