import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { requestPasswordOtp, verifyPasswordOtp, resetPassword } from '../api/authAPI'
import { CheckCircle, AlertCircle, Loader2, Eye, EyeOff, Lock } from 'lucide-react'

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
            setSuccessMessage('Xác thực OTP thành công. Vui lòng nhập mật khẩu mới.')
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
            }, 1800)
        } catch (err: any) {
            setError(err.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="forgot-card">
            <div className="forgot-body">
                <h1 className="forgot-title">Quên mật khẩu</h1>

                {error && (
                    <div style={{ padding: '10px 14px', marginBottom: '16px', background: '#FEF2F2', border: '1px solid #F87171', borderRadius: '8px', color: '#B91C1C', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {successMessage && (
                    <div style={{ padding: '10px 14px', marginBottom: '16px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px', color: '#15803D', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={16} />
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* ── STEP 1: Enter Email ── */}
                {step === 1 && (
                    <>
                        <p className="forgot-desc">
                            Vui lòng nhập địa chỉ email đã đăng ký của bạn. Hệ thống sẽ gửi mã OTP gồm 6 chữ số để xác thực đặt lại mật khẩu.
                        </p>
                        <form onSubmit={handleSendOtp} className="forgot-form">
                            <div className="forgot-field">
                                <label htmlFor="forgot-email" className="forgot-label">
                                    <span className="forgot-required">*</span> Địa chỉ email của bạn
                                </label>
                                <input
                                    id="forgot-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="forgot-input"
                                    placeholder="ví dụ: user@example.com hoặc gmail"
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div className="forgot-actions">
                                <Link to="/login" className="forgot-back-link">
                                    ← Quay lại đăng nhập
                                </Link>
                                <button
                                    id="forgot-submit-btn"
                                    type="submit"
                                    className={`forgot-btn${email.trim() && !isLoading ? '' : ' forgot-btn--disabled'}`}
                                    disabled={!email.trim() || isLoading}
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Gửi mã OTP'}
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {/* ── STEP 2: Enter OTP ── */}
                {step === 2 && (
                    <>
                        <p className="forgot-desc">
                            Mã xác thực OTP 6 số đã được gửi tới email <strong>{email}</strong>. Vui lòng kiểm tra Hộp thư đến (hoặc Thư rác/Spam) và nhập mã vào bên dưới:
                        </p>
                        <form onSubmit={handleVerifyOtp} className="forgot-form">
                            <div className="forgot-field">
                                <label htmlFor="forgot-otp" className="forgot-label">
                                    <span className="forgot-required">*</span> Mã OTP 6 chữ số
                                </label>
                                <input
                                    id="forgot-otp"
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    className="forgot-input"
                                    placeholder="Ví dụ: 123456"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="forgot-actions">
                                <button
                                    type="button"
                                    onClick={() => { setStep(1); setError(null); }}
                                    className="forgot-back-link"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                >
                                    ← Đổi email khác
                                </button>
                                <button
                                    id="forgot-verify-btn"
                                    type="submit"
                                    className={`forgot-btn${otp.trim().length === 6 && !isLoading ? '' : ' forgot-btn--disabled'}`}
                                    disabled={otp.trim().length !== 6 || isLoading}
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Xác nhận OTP'}
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {/* ── STEP 3: Enter New Password ── */}
                {step === 3 && (
                    <>
                        <p className="forgot-desc">
                            Tài khoản đã được xác thực thành công. Hãy nhập mật khẩu mới cho tài khoản của bạn:
                        </p>
                        <form onSubmit={handleResetPassword} className="forgot-form">
                            <div className="forgot-field">
                                <label htmlFor="new-password" className="forgot-label">
                                    <span className="forgot-required">*</span> Mật khẩu mới
                                </label>
                                <div className="login-input-wrapper" style={{ border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', display: 'flex', alignItems: 'center', height: '42px' }}>
                                    <span className="login-input-icon" style={{ paddingLeft: '10px' }}>
                                        <Lock size={16} className="icon-muted" />
                                    </span>
                                    <input
                                        id="new-password"
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="login-input"
                                        placeholder="Tối thiểu 6 ký tự"
                                        required
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        className="login-eye-btn"
                                        onClick={() => setShowNewPassword((v) => !v)}
                                        tabIndex={-1}
                                        aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
                                    >
                                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="forgot-field" style={{ marginTop: '14px' }}>
                                <label htmlFor="confirm-password" className="forgot-label">
                                    <span className="forgot-required">*</span> Xác nhận mật khẩu mới
                                </label>
                                <div className="login-input-wrapper" style={{ border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', display: 'flex', alignItems: 'center', height: '42px' }}>
                                    <span className="login-input-icon" style={{ paddingLeft: '10px' }}>
                                        <Lock size={16} className="icon-muted" />
                                    </span>
                                    <input
                                        id="confirm-password"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="login-input"
                                        placeholder="Nhập lại mật khẩu mới"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="login-eye-btn"
                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                        tabIndex={-1}
                                        aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="forgot-actions" style={{ marginTop: '20px' }}>
                                <Link to="/login" className="forgot-back-link">
                                    ← Hủy
                                </Link>
                                <button
                                    id="forgot-reset-btn"
                                    type="submit"
                                    className={`forgot-btn${newPassword && confirmPassword && !isLoading ? '' : ' forgot-btn--disabled'}`}
                                    disabled={!newPassword || !confirmPassword || isLoading}
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Đổi mật khẩu'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    )
}
