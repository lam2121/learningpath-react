import type {
	RoadmapLesson,
	RoadmapResponse,
	RoadmapTopic,
} from '@/feature/learning-path/api/roadmapApi'

export function isLessonGenerated(
	lesson: RoadmapLesson | null | undefined,
): boolean {
	return lesson?.is_generated === 1 || lesson?.is_generated === true
}

export function isLessonGenerationFailed(
	lesson: RoadmapLesson | null | undefined,
): boolean {
	return lesson?.is_generated === -1
}

export function isLessonReadyToStudy(
	lesson: RoadmapLesson | null | undefined,
): boolean {
	return Boolean(isLessonGenerated(lesson) && lesson?.is_unlocked)
}

export function isLessonGeneratedButLocked(
	lesson: RoadmapLesson | null | undefined,
): boolean {
	return Boolean(isLessonGenerated(lesson) && !lesson?.is_unlocked)
}

export function findLatestReadyLessonInTopic(
	selectedTopic?: RoadmapTopic | null,
): RoadmapLesson | null {
	if (!selectedTopic) {
		return null
	}

	return (
		[...selectedTopic.lessons]
			.reverse()
			.find((lesson) => isLessonReadyToStudy(lesson)) ?? null
	)
}

export function getNextAssignedLesson(
	roadmap: RoadmapResponse | null,
	passedLessonIds: Set<number>,
): {
	topic: RoadmapTopic
	lesson: RoadmapLesson
} | null {
	if (!roadmap) return null

	for (const topic of roadmap.topics) {
		const lesson = topic.lessons.find((item) => !passedLessonIds.has(item.id))
		if (lesson) {
			return { topic, lesson }
		}
	}

	return null
}
