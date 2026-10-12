import { LoginForm } from '../component/LoginForm'
import { AuthLayout } from '../component/AuthLayout'

export function LoginPage() {
	return (
		<AuthLayout
			badgeText="Next-Gen AI English Learning"
			heroHeadline="Accelerate Your Career with Tailored English"
			heroDescription="Unlock workplace confidence with interactive CEFR-aligned lessons, AI speech feedback, and role-specific vocabularies."
		>
			<LoginForm />
		</AuthLayout>
	)
}