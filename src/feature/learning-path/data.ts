import type { RoadmapTopic } from "@/feature/learning-path/roadmap.types";

export const roadmap: RoadmapTopic[] = [
    {
        id: 1,
        title: "Programming",
        subtitle: "Getting Started",
        status: "current",
        icon: "code",
        color: "bg-blue-500",
        x: 120,
        y: 80,
    },

    {
        id: 2,
        title: "HTML & CSS",
        subtitle: "Build UI",
        status: "current",
        icon: "html",
        color: "bg-orange-500",
        x: 700,
        y: 330,
    },

    {
        id: 3,
        title: "JavaScript",
        subtitle: "Core Language",
        status: "locked",
        icon: "react",
        color: "bg-yellow-500",
        x: 120,
        y: 650,
    },

    {
        id: 4,
        title: "React",
        subtitle: "Frontend",
        status: "locked",
        icon: "react",
        color: "bg-cyan-500",
        x: 700,
        y: 980,
    },

    {
        id: 5,
        title: "Backend API",
        subtitle: "FastAPI",
        status: "locked",
        icon: "backend",
        color: "bg-green-500",
        x: 120,
        y: 1310,
    },

    {
        id: 6,
        title: "Database",
        subtitle: "PostgreSQL",
        status: "locked",
        icon: "database",
        color: "bg-violet-500",
        x: 700,
        y: 1640,
    },

    {
        id: 7,
        title: "Security",
        subtitle: "Authentication",
        status: "locked",
        icon: "security",
        color: "bg-red-500",
        x: 120,
        y: 1970,
    },

    {
        id: 8,
        title: "Capstone",
        subtitle: "Real Project",
        status: "locked",
        icon: "project",
        color: "bg-slate-700",
        x: 700,
        y: 2300,
    },
];