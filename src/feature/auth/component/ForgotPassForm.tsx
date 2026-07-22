import { useState } from 'react'
import { Link } from '@tanstack/react-router'

export function ForgotPassForm() {
    const [email, setEmail] = useState('')

    const isValid = email.trim() !== ''

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // TODO: handle forgot password
    }

    return (
        <div className="forgot-card">
            {/* Card body */}
            <div className="forgot-body">
                {/* Title */}
                <h1 className="forgot-title">Quên mật khẩu</h1>

                {/* Description */}
                <p className="forgot-desc">
                    Bạn quên mật khẩu của mình? Đừng lo lắng! Hãy cung cấp cho chúng tôi email bạn sử dụng
                    để đăng ký tài khoản CareerPath. Chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật
                    khẩu của bạn qua email đó.
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="forgot-form">
                    {/* Email field */}
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
                            autoComplete="email"
                        />
                    </div>

                    {/* Actions row */}
                    <div className="forgot-actions">
                        <Link to="/login" className="forgot-back-link">
                            ← Quay lại đăng nhập
                        </Link>
                        <button
                            id="forgot-submit-btn"
                            type="submit"
                            className={`forgot-btn${isValid ? '' : ' forgot-btn--disabled'}`}
                            disabled={!isValid}
                        >
                            Gửi email cho tôi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
