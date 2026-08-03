import {
    Sparkles,
} from "lucide-react";

export function RoadmapHero() {
    return (
        <div className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 shadow-lg py-12">
            <div className="mx-auto max-w-7xl px-8">
                <div className="flex items-center gap-3 text-white/90">
                    <Sparkles className="h-8 w-8" />
                    <span className="font-semibold uppercase tracking-wider text-sm">
                        Personalized Learning Roadmap
                    </span>
                </div>

                <h1 className="mt-5 text-4xl md:text-5xl font-extrabold text-white">
                    Hello Lâm 👋
                </h1>

                <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-50">
                    Based on your placement test,
                    our AI has generated a personalized roadmap
                    that will guide you from beginner
                    to
                    <span className="font-bold text-white bg-white/20 px-2 py-1 rounded-md ml-2">
                        Full Stack Developer.
                    </span>
                </p>
            </div>
        </div>
    );
}