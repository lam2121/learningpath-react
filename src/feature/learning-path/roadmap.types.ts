export type TopicStatus =
    | "completed"
    | "current"
    | "locked";

export type TopicIcon =
    | "code"
    | "html"
    | "react"
    | "backend"
    | "database"
    | "security"
    | "project";

export interface RoadmapTopic {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    lessonsCount: number;
    durationMinutes: number;
    status: TopicStatus;
    icon: TopicIcon;
    color: string;
    x: number;
    y: number;
}