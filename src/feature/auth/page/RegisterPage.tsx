import { RegisterForm } from '../component/RegisterForm'
import backgroundImage from '@/asset/image/banner_background.png'
import logo from '@/asset/image/tma_logo.png'
export function RegisterPage() {
	return (
		<div className="relative min-h-screen bg-cover bg-center " style={{ backgroundImage: `url(${backgroundImage})` }}>
			<img src={logo} alt="Logo" className="absolute top-6 left-6 w-40 h-auto z-10" />
			<div className="register-page">
				<RegisterForm />
			</div>
		</div>
	)
}
