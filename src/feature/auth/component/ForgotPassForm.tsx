import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { requestPasswordOtp, verifyPasswordOtp, resetPassword } from '../api/authAPI'
import { CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Lock, Mail, KeyRound, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'

export function ForgotPassForm() {
	const navigate = useNavigate()
	const [step, setStep] = useState<1 | 2 | 3>(1)
	const [email, setEmail] = useState('')
	const [otp, setOtp] = useState('')
	const [resetToken, setResetToken] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showNewPassword, setShowNewPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [successMessage, setSuccessMessage] = useState<string | null>(null)

	// Step 1: Send OTP to Email
	const handleSendOtp = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!email.trim()) return

		setIsLoading(true)
		setError(null)
		try {
			const res = await requestPasswordOtp(email.trim())
			setSuccessMessage(res.message || 'Mã OTP đã được gửi đến email của bạn.')
			setStep(2)
		} catch (err: any) {
			setError(err.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại email.')
		} finally {
			setIsLoading(false)
		}
	}

	// Step 2: Verify OTP
	const handleVerifyOtp = async (e: React.FormEvent) => {
		e.preventDefault()
		if (otp.trim().length !== 6) {
			setError('Mã OTP phải gồm đúng 6 chữ số.')
			return
		}

		setIsLoading(true)
		setError(null)
		try {
			const res = await verifyPasswordOtp(email.trim(), otp.trim())
			setResetToken(res.token)
			setSuccessMessage('Xác thực OTP thành công. Vui lòng đặt mật khẩu mới.')
			setStep(3)
		} catch (err: any) {
			setError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.')
		} finally {
			setIsLoading(false)
		}
	}

	// Step 3: Set New Password
	const handleResetPassword = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!newPassword || newPassword.length < 6) {
			setError('Mật khẩu mới phải có ít nhất 6 ký tự.')
			return
		}
		if (newPassword !== confirmPassword) {
			setError('Mật khẩu xác nhận không khớp.')
			return
		}

		setIsLoading(true)
		setError(null)
		try {
			await resetPassword(resetToken, newPassword)
			setSuccessMessage('Đổi mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...')
			setTimeout(() => {
				navigate({ to: '/login' })
			}, 1500)
		} catch (err: any) {
			setError(err.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.')
		} finally {
			setIsLoading(false)
		}
	}

	const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword
	const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

	return (
		<div className="w-full rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-slate-900/95 sm:bg-white/90 sm:dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 sm:border-white/60 sm:dark:border-slate-800/90 shadow-xl sm:shadow-2xl p-5 sm:p-9 transition-all duration-300">
			{/* Stepper Progress Bar */}
			<div className="mb-4 sm:mb-7">
				<div className="flex items-center justify-between mb-2">
					{[
						{ num: 1, label: 'Email' },
						{ num: 2, label: 'Verify OTP' },
						{ num: 3, label: 'New Password' },
					].map((item) => {
						const isCompleted = step > item.num
						const isCurrent = step === item.num
						return (
							<div key={item.num} className="flex items-center gap-1.5 sm:gap-2">
								<div
									className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-[11px] sm:text-xs font-bold transition-all ${
										isCompleted
											? 'bg-emerald-500 text-white shadow-xs'
											: isCurrent
											? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-3 sm:ring-4 ring-blue-500/15'
											: 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
									}`}
								>
									{isCompleted ? <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : item.num}
								</div>
								<span
									className={`text-[11px] sm:text-xs font-medium ${
										isCurrent
											? 'text-slate-900 dark:text-white font-semibold'
											: 'text-slate-400 dark:text-slate-500'
									}`}
								>
									{item.label}
								</span>
							</div>
						)
					})}
				</div>
				<div className="relative h-1 sm:h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
					<div
						className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 rounded-full"
						style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
					/>
				</div>
			</div>

			{/* Card Header based on step */}
			<div className="mb-4 sm:mb-6 space-y-1 sm:space-y-2">
				<div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 text-blue-600 dark:text-blue-400">
					{step === 1 && <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
					{step === 2 && <KeyRound className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
					{step === 3 && <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
					<span>Bước {step} / 3: {step === 1 ? 'Xác thực Email' : step === 2 ? 'Nhập mã OTP' : 'Mật khẩu mới'}</span>
				</div>
				<h1 className="font-display text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
					{step === 1 && 'Khôi phục mật khẩu'}
					{step === 2 && 'Xác thực mã OTP'}
					{step === 3 && 'Đặt mật khẩu mới'}
				</h1>
				<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
					{step === 1 && 'Nhập địa chỉ email tài khoản của bạn để nhận mã OTP gồm 6 chữ số.'}
					{step === 2 && (
						<>
							Mã xác thực gồm 6 chữ số đã được gửi tới email <strong className="text-slate-700 dark:text-slate-200">{email}</strong>.
						</>
					)}
					{step === 3 && 'Tài khoản đã được xác thực. Hãy nhập mật khẩu mới cho tài khoản của bạn.'}
				</p>
			</div>

			{/* Error Alert */}
			{error && (
				<div
					role="alert"
					className="mb-3.5 sm:mb-5 flex items-start gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3 text-xs text-red-700 dark:text-red-400 animate-shake"
				>
					<AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
					<span className="leading-relaxed font-medium">{error}</span>
				</div>
			)}

			{/* Success Alert */}
			{successMessage && (
				<div
					role="alert"
					className="mb-3.5 sm:mb-5 flex items-start gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-3 text-xs text-emerald-700 dark:text-emerald-400"
				>
					<CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
					<span className="leading-relaxed font-medium">{successMessage}</span>
				</div>
			)}

			{/* STEP 1: Enter Email */}
			{step === 1 && (
				<form onSubmit={handleSendOtp} className="space-y-3 sm:space-y-4">
					<div className="space-y-1">
						<label
							htmlFor="forgot-email"
							className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
						>
							Địa chỉ Email đăng ký
						</label>
						<div className="group relative flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-3 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-400/15 transition-all duration-200 shadow-2xs overflow-hidden">
							<div className="flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
								<Mail className="h-4 w-4" />
							</div>
							<input
								id="forgot-email"
								type="email"
								value={email}
								onChange={(e) => {
									setEmail(e.target.value)
									if (error) setError(null)
								}}
								placeholder="user@company.com"
								className="h-10 sm:h-11 w-full bg-transparent pr-4 text-base sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden"
								autoComplete="email"
								required
								autoFocus
							/>
						</div>
					</div>

					<div className="flex items-center justify-between pt-1 sm:pt-2">
						<Link
							to="/login"
							className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
						>
							<ArrowLeft className="h-3.5 w-3.5" />
							<span>Quay lại</span>
						</Link>

						<button
							id="forgot-submit-btn"
							type="submit"
							disabled={!email.trim() || isLoading}
							className="group relative h-10.5 sm:h-11 px-4 sm:px-5 rounded-xl font-semibold text-xs sm:text-sm text-white shadow-lg shadow-blue-500/25 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
						>
							{isLoading ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									<span>Đang gửi...</span>
								</>
							) : (
								<>
									<span>Gửi mã OTP</span>
									<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
								</>
							)}
						</button>
					</div>
				</form>
			)}

			{/* STEP 2: Enter OTP */}
			{step === 2 && (
				<form onSubmit={handleVerifyOtp} className="space-y-3 sm:space-y-4">
					<div className="space-y-1">
						<label
							htmlFor="forgot-otp"
							className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
						>
							Mã OTP 6 chữ số
						</label>
						<div className="group relative flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-3 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-400/15 transition-all duration-200 shadow-2xs overflow-hidden">
							<div className="flex h-11 sm:h-12 w-11 sm:w-12 items-center justify-center text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
								<KeyRound className="h-5 w-5" />
							</div>
							<input
								id="forgot-otp"
								type="text"
								maxLength={6}
								value={otp}
								onChange={(e) => {
									setOtp(e.target.value.replace(/\D/g, ''))
									if (error) setError(null)
								}}
								placeholder="123456"
								className="h-11 sm:h-12 w-full bg-transparent pr-4 font-mono text-center text-lg sm:text-xl font-bold tracking-[0.35em] sm:tracking-[0.4em] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden"
								required
								autoFocus
							/>
						</div>
					</div>

					<div className="flex items-center justify-between pt-1 sm:pt-2">
						<button
							type="button"
							onClick={() => {
								setStep(1)
								setError(null)
							}}
							className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
						>
							<ArrowLeft className="h-3.5 w-3.5" />
							<span>Đổi email</span>
						</button>

						<button
							id="forgot-verify-btn"
							type="submit"
							disabled={otp.trim().length !== 6 || isLoading}
							className="group relative h-10.5 sm:h-11 px-4 sm:px-5 rounded-xl font-semibold text-xs sm:text-sm text-white shadow-lg shadow-blue-500/25 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
						>
							{isLoading ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									<span>Đang xác nhận...</span>
								</>
							) : (
								<>
									<span>Xác nhận OTP</span>
									<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
								</>
							)}
						</button>
					</div>
				</form>
			)}

			{/* STEP 3: Enter New Password */}
			{step === 3 && (
				<form onSubmit={handleResetPassword} className="space-y-3 sm:space-y-4">
					{/* New Password */}
					<div className="space-y-1">
						<div className="flex items-center justify-between">
							<label
								htmlFor="new-password"
								className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
							>
								Mật khẩu mới
							</label>
							<span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">Min. 6 ký tự</span>
						</div>
						<div className="group relative flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-3 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-400/15 transition-all duration-200 shadow-2xs overflow-hidden">
							<div className="flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
								<Lock className="h-4 w-4" />
							</div>
							<input
								id="new-password"
								type={showNewPassword ? 'text' : 'password'}
								value={newPassword}
								onChange={(e) => {
									setNewPassword(e.target.value)
									if (error) setError(null)
								}}
								placeholder="Nhập mật khẩu mới"
								className="h-10 sm:h-11 w-full bg-transparent pr-10 text-base sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden"
								required
								autoFocus
							/>
							<button
								type="button"
								onClick={() => setShowNewPassword((v) => !v)}
								tabIndex={-1}
								className="absolute right-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
								aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
							>
								{showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</button>
						</div>
					</div>

					{/* Confirm Password */}
					<div className="space-y-1">
						<div className="flex items-center justify-between">
							<label
								htmlFor="confirm-password"
								className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
							>
								Xác nhận mật khẩu
							</label>
							{passwordsMatch && (
								<span className="text-[10px] sm:text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
									<CheckCircle2 className="h-3 w-3" /> Trùng khớp
								</span>
							)}
							{passwordsMismatch && (
								<span className="text-[10px] sm:text-[11px] font-medium text-red-500">Chưa khớp</span>
							)}
						</div>
						<div className="group relative flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-3 focus-within:ring-blue-500/10 dark:focus-within:ring-blue-400/15 transition-all duration-200 shadow-2xs overflow-hidden">
							<div className="flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
								<Lock className="h-4 w-4" />
							</div>
							<input
								id="confirm-password"
								type={showConfirmPassword ? 'text' : 'password'}
								value={confirmPassword}
								onChange={(e) => {
									setConfirmPassword(e.target.value)
									if (error) setError(null)
								}}
								placeholder="Nhập lại mật khẩu"
								className="h-10 sm:h-11 w-full bg-transparent pr-10 text-base sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden"
								required
							/>
							<button
								type="button"
								onClick={() => setShowConfirmPassword((v) => !v)}
								tabIndex={-1}
								className="absolute right-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
								aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
							>
								{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</button>
						</div>
					</div>

					<div className="flex items-center justify-between pt-1 sm:pt-2">
						<Link
							to="/login"
							className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
						>
							<ArrowLeft className="h-3.5 w-3.5" />
							<span>Hủy</span>
						</Link>

						<button
							id="forgot-reset-btn"
							type="submit"
							disabled={!newPassword || !confirmPassword || isLoading}
							className="group relative h-10.5 sm:h-11 px-4 sm:px-5 rounded-xl font-semibold text-xs sm:text-sm text-white shadow-lg shadow-blue-500/25 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
						>
							{isLoading ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									<span>Đang cập nhật...</span>
								</>
							) : (
								<>
									<span>Đổi mật khẩu</span>
									<ShieldCheck className="h-4 w-4" />
								</>
							)}
						</button>
					</div>
				</form>
			)}
		</div>
	)
}
