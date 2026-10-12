import { RegisterForm } from '../component/RegisterForm'
import { AuthLayout } from '../component/AuthLayout'

export function RegisterPage() {
	return (
		<AuthLayout
			badgeText="Join the AI Learning Revolution"
			heroHeadline="Empower Your English Skills for Global Opportunities"
			heroDescription="From technical discussions to executive presentations — build the communication mastery you need with personalized AI roadmaps."
		>
			<RegisterForm />
		</AuthLayout>
	)
}
