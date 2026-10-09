import type { RoadmapTopic } from "../api/roadmapApi";
import { userProfileTexts } from "@/feature/user-profile/userProfileTexts";

export function pluralize(
    value: number,
    singular: string,
    plural = `${singular}s`,
) {
    return `${value} ${value === 1 ? singular : plural}`;
}

export function formatLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export function formatMinutes(minutes: number) {
    return userProfileTexts.formatEstimatedHours(minutes);
}

export function getGeneratedLessonsCount(topic: RoadmapTopic) {
    return topic.lessons.filter((lesson) => lesson.is_generated === 1 || lesson.is_generated === true).length;
}

export function findRequestedTopicId(
    topics: RoadmapTopic[],
    requestedTopicId: number | undefined,
) {
    if (requestedTopicId === undefined) {
        return null;
    }

    return topics.some((topic) => topic.id === requestedTopicId)
        ? requestedTopicId
        : null;
}
