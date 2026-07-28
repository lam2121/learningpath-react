import { createFileRoute } from '@tanstack/react-router';
import { QuizShell } from '@/feature/quiz-engine/component/QuizShell';

export const Route = createFileRoute('/_protected/quiz/$quizType/$targetId')({
	component: QuizRoute,
});

function QuizRoute() {
	const { quizType, targetId } = Route.useParams();
	
	return (
		<QuizShell 
			type={quizType as 'lesson' | 'topic' | 'final'} 
			targetId={targetId}
		/>
	);
}