import { Button } from "@/shadcn/component/ui/button";

import {
    ArrowRight,
} from "lucide-react";
import { RoadmapHero } from "../component/RoadmapHero";
import { CurriculumRoadmap } from "../component/CurriculumRoadmap";
import { RoadmapStats } from "../component/RoadmapStats";
export function CurriculumRoadmapPage() {
    return (
        <div className="mx-auto max-w-5xl px-6 py-8">

            <RoadmapHero />

            <div className="mt-6">
                <RoadmapStats />
            </div>

            {/* Roadmap */}

            <div className="mt-10">

                <CurriculumRoadmap />

            </div>

            {/* Bottom */}

            <div className="mt-10 flex justify-center">

                <Button
                    size="lg"
                    className="gap-2 px-10"
                >

                    Start Learning

                    <ArrowRight className="h-5 w-5" />

                </Button>

            </div>

        </div>
    );
}