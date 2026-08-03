import { useState, useEffect } from "react";
import { Button } from "@/shadcn/component/ui/button";
import { MainNavigationMenu } from '@/common/component/MainNavigationMenu'
import {
    ArrowRight,
} from "lucide-react";
import { RoadmapHero } from "../component/RoadmapHero";
import { CurriculumRoadmap } from "../component/CurriculumRoadmap";
import { RoadmapStats } from "../component/RoadmapStats";
import { roadmap } from "@/feature/learning-path/data";
import { Link } from "@tanstack/react-router"
export function CurriculumRoadmapPage() {
    const [showSidebar, setShowSidebar] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 350) {
                setShowSidebar(true);
            } else {
                setShowSidebar(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="relative min-h-screen overflow-x-hidden pb-24">
            <MainNavigationMenu />

            {/* Premium & Responsive Background */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                {/* Glowing Orbs */}
                <div className="absolute left-[-10%] top-[-10%] -z-10 h-[50vw] w-[50vw] max-h-[500px] max-w-[500px] rounded-full bg-blue-500 opacity-20 blur-[100px]"></div>
                <div className="absolute left-1/4 bottom-[-20%] -z-10 h-[60vw] w-[60vw] max-h-[600px] max-w-[600px] rounded-full bg-orange-500 opacity-20 blur-[120px]"></div>
                <div className="absolute right-[-10%] top-1/3 -z-10 h-[40vw] w-[40vw] max-h-[400px] max-w-[400px] rounded-full bg-violet-500 opacity-20 blur-[100px]"></div>
            </div>

            {/* Static Top Section (Hero + Stats) */}
            <div className="w-full relative z-10">
                <RoadmapHero />
                <div className="mt-8">
                    <RoadmapStats />
                </div>
            </div>

            {/* Sliding Sidebar Navigation */}
            <div
                className={`fixed left-0 top-24 bottom-10 z-50 hidden md:flex items-start transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${showSidebar ? 'translate-x-0' : '-translate-x-[102%]'}`}
            >
                {/* Sidebar Content */}
                <div className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-r-3xl border-y border-r border-slate-200/50 dark:border-slate-800/50 shadow-2xl w-80 max-h-full flex flex-col`}>
                    <div className="p-6 pb-4 shrink-0">
                        <h3 className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
                            Curriculum Content
                        </h3>
                    </div>
                    <div className="px-6 pb-6 overflow-y-auto custom-scrollbar flex-1">
                        <ul className="space-y-4">
                            {roadmap.map((topic) => (
                                <li key={topic.id}>
                                    <button
                                        onClick={() => {
                                            const element = document.getElementById(`topic-${topic.id}`);
                                            if (element) {
                                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }
                                        }}
                                        className="flex items-center gap-4 w-full text-left group/btn p-2 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md transition-all duration-300 group-hover/btn:scale-110 group-hover/btn:shadow-lg shrink-0 ${topic.color}`}>
                                            {topic.id}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors">
                                                {topic.title}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-500">
                                                {topic.subtitle}
                                            </span>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Shifting Roadmap Content */}
            <div className={`mx-auto max-w-5xl px-6 relative z-10 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${showSidebar ? 'md:translate-x-[160px]' : 'translate-x-0'}`}>
                {/* Main Content: Roadmap */}
                <div className="mt-20 flex justify-center w-full">
                    <div className="w-full overflow-visible">
                        <CurriculumRoadmap />
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-24 flex justify-center relative z-20">
                    <Button
                        size="lg"
                        className="gap-3 px-12 h-16 text-lg rounded-full shadow-[0_10px_40px_-10px_rgba(59,130,246,0.6)] hover:shadow-[0_10px_40px_-5px_rgba(59,130,246,0.8)] transition-all duration-300 hover:-translate-y-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold"
                    >
                        <Link to="/lessons/lesson">
                            Start Learning Now
                        </Link>
                        <ArrowRight className="h-6 w-6" />
                    </Button>
                </div>
            </div>
        </div>
    );
}