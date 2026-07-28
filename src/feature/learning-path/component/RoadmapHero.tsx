import {
    Sparkles,
} from "lucide-react";

export function RoadmapHero() {
    return (
        <div className="mx-auto max-w-5xl rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-8 py-7 text-white shadow-lg">
            <div className="flex items-center gap-3">

                <Sparkles className="h-8 w-8" />

                <span className="font-semibold uppercase tracking-wider">
                    Personalized Learning Roadmap
                </span>

            </div>

            <h1 className="mt-5 text-4xl font-bold">
                Hello Lâm 👋
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-blue-100">

                Based on your placement test,
                our AI has generated a personalized roadmap
                that will guide you from beginner
                to

                <span className="font-semibold text-white">
                    {" "}Full Stack Developer.
                </span>

            </p>

        </div>
    );
}