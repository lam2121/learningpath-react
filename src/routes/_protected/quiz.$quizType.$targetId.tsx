import { createFileRoute } from '@tanstack/react-router';
import { QuizShell } from '@/feature/quiz-engine/component/QuizShell';
import { TopicQuizEngine } from '@/feature/topic-quiz/component/TopicQuizEngine';
import { FinalQuizEngine } from '@/feature/final-quiz/component/FinalQuizEngine';

export const Route = createFileRoute('/_protected/quiz/$quizType/$targetId')({
	component: QuizRoute,
});

function QuizRoute() {
	const { quizType, targetId } = Route.useParams();

	if (quizType === 'topic') {
		return <TopicQuizEngine topicId={Number(targetId)} />;
	}

	if (quizType === 'final') {
		return <FinalQuizEngine />;
	}

	return (
		<QuizShell
			type={quizType as 'lesson' | 'topic' | 'final'}
			targetId={targetId}
		/>
	);
}