import { ForgotPassForm } from '../component/ForgotPassForm'
import { AuthLayout } from '../component/AuthLayout'

export function ForgotPassPage() {
	return (
		<AuthLayout
			badgeText="Account Security & Recovery"
			heroHeadline="Secure Account Recovery for Seamless Learning"
			heroDescription="Regain access to your career milestones, daily vocabulary decks, and AI speech progress quickly and securely."
		>
			<ForgotPassForm />
		</AuthLayout>
	)
}
