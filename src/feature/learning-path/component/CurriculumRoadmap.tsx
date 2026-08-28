import { roadmap } from "@/feature/learning-path/data";
import { TopicNode } from "./TopicNode";

export function CurriculumRoadmap() {
    return (
        <section className="w-full min-w-0">
            <div className="mb-4 flex items-end justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        Nội dung chương trình
                    </h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Chọn một chương để xem danh sách bài học.
                    </p>
                </div>

                <span className="hidden shrink-0 text-sm text-slate-500 sm:block">
                    {roadmap.length} chương
                </span>
            </div>

            <div
                className="
                    grid w-full grid-cols-1 gap-4
                    sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]
                "
            >
                {roadmap.map((topic) => (
                    <TopicNode
                        key={topic.id}
                        {...topic}
                    />
                ))}
            </div>
        </section>
    );
}
