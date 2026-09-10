import { ForgotPassForm } from '../component/ForgotPassForm'
import backgroundImage from '@/asset/image/banner_background.png'
import logo from '@/asset/image/careerpath_logo.png'
export function ForgotPassPage() {
	return (
		<div className="relative min-h-screen bg-cover bg-center " style={{ backgroundImage: `url(${backgroundImage})` }}>
			<img src={logo} alt="CareerPath Logo" className="absolute top-6 left-6 w-28 sm:w-40 h-auto z-10" />
			<div className="forgot-page">
				<ForgotPassForm />
			</div>
		</div>
	)
}
