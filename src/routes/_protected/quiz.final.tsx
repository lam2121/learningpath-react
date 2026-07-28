import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/quiz/final')({
	beforeLoad: () => {
		// Redirect to the actual final test
		throw redirect({ to: '/quiz/final/final-test' });
	},
	component: () => null,
});