import { RoadPath } from "./RoadPath";
import { TopicNode } from "./TopicNode";
import { roadmap } from "@/feature/learning-path/data";
import { useNavigate } from "@tanstack/react-router";
export function CurriculumRoadmap() {
    const navigate = useNavigate();
    return (
        <div
            className="
        relative
        mx-auto
        w-full
        max-w-6xl
        h-[2600px]
    "
        >
            <RoadPath
                points={roadmap.map((topic) => ({
                    x: topic.x + 64,
                    y: topic.y + 64,
                }))}
            />

            {roadmap.map((topic) => (
                <div
                    key={topic.id}
                    id={`topic-${topic.id}`}
                    className="absolute scroll-mt-32"
                    style={{
                        left: topic.x,
                        top: topic.y,
                    }}
                >
                    <TopicNode {...topic}
                        onClick={
                            topic.status === "current"
                                ? () => navigate({ to: "/lesson" })
                                : undefined
                        } />
                </div>
            ))}
        </div>
    );
}