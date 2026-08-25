import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
    ArrowRight,
    Bot,
    BrainCircuit,
    CheckCircle2,
    Compass,
    MessagesSquare,
    Sparkles,
    Target,
} from "lucide-react";

import CareerpathIcon from "@/asset/image/careerpath_logo.png";

const aiCapabilities = [
    "Role-based placement test",
    "Personal lesson roadmap",
    "Adaptive review after each quiz",
    "AI-guided study pacing",
] as const;

const roadmapSteps = [
    { title: "Assess", icon: Target },
    { title: "Build Path", icon: Compass },
    { title: "Coach Daily", icon: BrainCircuit },
] as const;

export function Home() {
    const [isRobotLive, setIsRobotLive] = useState(true);
    const primaryCta = isRobotLive
        ? { to: "/login", label: "Start your AI path" }
        : { to: "/discover", label: "Discover in anonymous mode" };

    return (
        <main className="relative overflow-hidden bg-[linear-gradient(180deg,#f6fbff_0%,#edf7ff_45%,#f7fbff_100%)] text-slate-950">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(14,165,233,0.16),transparent_22%),radial-gradient(circle_at_86%_10%,rgba(34,211,238,0.14),transparent_18%),radial-gradient(circle_at_60%_44%,rgba(14,116,144,0.08),transparent_24%)]" />

            <section className="relative mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-[1480px] items-center px-4 py-4 sm:px-6 lg:px-8">
                <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)] lg:items-center">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-sky-800 shadow-[0_10px_24px_rgba(14,165,233,0.10)]">
                            <Sparkles className="h-4 w-4" />
                            AI Learning Path
                        </div>

                        <h1 className="mt-5 text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-5xl xl:text-6xl">
                            Learn with an
                            {" "}
                            <span className="bg-[linear-gradient(135deg,#005596_0%,#0072BB_50%,#14b8a6_100%)] bg-clip-text text-transparent">
                                AI coach
                            </span>
                            {" "}
                            that builds your path for real work.
                        </h1>

                        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                            CareerPath turns assessment results into a personalized English roadmap for IT communication. You study the right lessons, review the right weaknesses, and move with a plan that adapts as you improve.
                        </p>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <Link
                                to={primaryCta.to}
                                className="inline-flex items-center justify-center rounded-2xl bg-[#0072BB] px-6 py-3.5 text-base font-bold text-white shadow-[0_18px_34px_rgba(0,114,187,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#005f9b]"
                            >
                                {primaryCta.label}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>

                            <Link
                                to="/guide"
                                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white/90 px-6 py-3.5 text-base font-bold text-slate-800 transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-800"
                            >
                                See how it works
                            </Link>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            {aiCapabilities.map((item) => (
                                <div
                                    key={item}
                                    className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/82 px-4 py-3 shadow-[0_10px_24px_rgba(148,163,184,0.10)] backdrop-blur"
                                >
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
                                    <p className="text-sm font-semibold text-slate-700">
                                        {item}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 grid gap-3 md:grid-cols-3">
                            {roadmapSteps.map((step, index) => {
                                const Icon = step.icon;
                                return (
                                    <div
                                        key={step.title}
                                        className="rounded-3xl border border-slate-200 bg-white/75 px-4 py-4 shadow-[0_10px_24px_rgba(148,163,184,0.08)]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-800">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                                    Step {index + 1}
                                                </p>
                                                <p className="text-sm font-black text-slate-900">
                                                    {step.title}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -left-4 top-10 hidden h-28 w-28 rounded-full bg-cyan-200/40 blur-3xl lg:block" />
                        <div className="absolute -right-4 bottom-4 hidden h-36 w-36 rounded-full bg-sky-300/30 blur-3xl lg:block" />

                        <div className="overflow-hidden rounded-[2rem] border border-sky-100 bg-[linear-gradient(145deg,#ffffff_0%,#eff8ff_58%,#dff3ff_100%)] p-4 shadow-[0_24px_56px_rgba(14,116,144,0.16)] sm:p-5">
                            <div className="flex items-center justify-between rounded-2xl border border-sky-100 bg-white/85 px-4 py-3">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">
                                        AI Coach Console
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-700">
                                        Adaptive learning path active
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    aria-pressed={isRobotLive}
                                    onClick={() => setIsRobotLive((current) => !current)}
                                    className={`rounded-2xl px-3 py-2 text-white shadow-lg transition-colors ${isRobotLive
                                            ? "bg-sky-600 hover:bg-sky-700"
                                            : "bg-slate-500 hover:bg-slate-600"
                                        }`}
                                >
                                    <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${isRobotLive ? "text-sky-100" : "text-slate-200"
                                        }`}>
                                        Status
                                    </p>
                                    <p className="text-sm font-black">{isRobotLive ? "Live" : "Sleep"}</p>
                                </button>
                            </div>

                            <div className="mt-4 grid items-stretch gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                                <div className={`flex h-full flex-col rounded-[1.75rem] p-5 text-white shadow-[0_18px_34px_rgba(0,85,150,0.22)] transition-all ${isRobotLive
                                        ? "bg-[linear-gradient(180deg,#003d6d_0%,#005596_42%,#0072BB_100%)]"
                                        : "bg-[linear-gradient(180deg,#1e3a5f_0%,#35597e_42%,#58779b_100%)]"
                                    }`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-100/90">
                                                Smart mentor
                                            </p>
                                            <h2 className="mt-2 text-2xl font-black">
                                                Robo Coach
                                            </h2>
                                        </div>
                                        <div className="rounded-2xl bg-white/10 p-3">
                                            <Bot className="h-7 w-7" />
                                        </div>
                                    </div>

                                    <div className={`relative mt-5 flex min-h-[24rem] flex-1 items-center justify-center rounded-[1.5rem] border border-white/10 px-6 py-8 transition-all lg:min-h-[26rem] ${isRobotLive
                                            ? "bg-[radial-gradient(circle_at_50%_24%,rgba(125,211,252,0.34),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)]"
                                            : "bg-[radial-gradient(circle_at_50%_24%,rgba(148,163,184,0.22),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.01)_100%)]"
                                        }`}>
                                        <div className={`absolute left-8 top-8 h-3 w-3 rounded-full transition-opacity ${isRobotLive ? "bg-white/35" : "bg-white/20 opacity-60"}`} />
                                        <div className={`absolute right-10 top-10 h-2.5 w-2.5 rounded-full transition-opacity ${isRobotLive ? "bg-cyan-100/45" : "bg-slate-200/30 opacity-60"}`} />
                                        <div className={`absolute left-12 top-24 h-2 w-2 rounded-full transition-opacity ${isRobotLive ? "bg-sky-100/40" : "bg-slate-200/20 opacity-50"}`} />
                                        <div className={`absolute right-14 top-24 h-3 w-3 rounded-full transition-opacity ${isRobotLive ? "bg-white/28" : "bg-slate-200/20 opacity-50"}`} />
                                        <div className="relative flex flex-col items-center">
                                            <div className={`relative h-40 w-40 rounded-[2.7rem] border border-white/20 shadow-[0_18px_40px_rgba(34,211,238,0.40)] transition-all lg:h-44 lg:w-44 ${isRobotLive
                                                    ? "bg-[linear-gradient(180deg,#e8fbff_0%,#9be3ff_42%,#38bdf8_100%)]"
                                                    : "bg-[linear-gradient(180deg,#dfe7ef_0%,#9eb4c8_42%,#6d88a3_100%)]"
                                                }`}>
                                                <div className="absolute left-1/2 top-[-1.15rem] h-7 w-[3px] -translate-x-1/2 rounded-full bg-cyan-100/90" />
                                                <div className="absolute left-1/2 top-[-1.55rem] h-5 w-5 -translate-x-1/2 rounded-full border border-white/50 bg-white/85 shadow-sm" />
                                                <div className="absolute left-1/2 top-4 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-white/80" />
                                                <div className={`absolute left-8 top-12 flex items-center justify-center rounded-full bg-[#003d6d] transition-all ${isRobotLive ? "h-6 w-6" : "h-2 w-7 rounded-full"}`}>
                                                    {isRobotLive ? <span className="h-2 w-2 rounded-full bg-white/95" /> : null}
                                                </div>
                                                <div className={`absolute right-8 top-12 flex items-center justify-center rounded-full bg-[#003d6d] transition-all ${isRobotLive ? "h-6 w-6" : "h-2 w-7 rounded-full"}`}>
                                                    {isRobotLive ? <span className="h-2 w-2 rounded-full bg-white/95" /> : null}
                                                </div>
                                                <div className="absolute left-9 top-[5rem] h-3 w-4 rounded-full bg-pink-100/85" />
                                                <div className="absolute right-9 top-[5rem] h-3 w-4 rounded-full bg-pink-100/85" />
                                                <div className={`absolute left-1/2 top-[5.45rem] h-3.5 -translate-x-1/2 border-[#005596] transition-all ${isRobotLive
                                                        ? "w-12 rounded-full border-b-[3px]"
                                                        : "w-8 rounded-full border-b-[2px]"
                                                    }`} />
                                                <div className="absolute left-1/2 top-[6.4rem] h-2 w-9 -translate-x-1/2 rounded-full bg-white/20" />
                                                <div className="absolute -left-3 top-14 h-12 w-3.5 rounded-full bg-cyan-200/90" />
                                                <div className="absolute -right-3 top-14 h-12 w-3.5 rounded-full bg-cyan-200/90" />
                                                <div className="absolute -left-6 top-[6.4rem] h-3 w-8 rounded-full bg-cyan-100/65" />
                                                <div className="absolute -right-6 top-[6.4rem] h-3 w-8 rounded-full bg-cyan-100/65" />
                                            </div>
                                            <div className={`mt-6 flex h-32 w-36 items-center justify-center rounded-[2.1rem] border border-white/15 shadow-[0_14px_28px_rgba(34,211,238,0.24)] transition-all lg:h-36 lg:w-40 ${isRobotLive
                                                    ? "bg-[linear-gradient(180deg,#8fe3ff_0%,#22d3ee_100%)]"
                                                    : "bg-[linear-gradient(180deg,#b6cadb_0%,#7e9ab4_100%)]"
                                                }`}>
                                                <div className={`flex h-18 w-18 items-center justify-center rounded-[1.35rem] shadow-[0_8px_18px_rgba(255,255,255,0.25)] transition-all ${isRobotLive ? "bg-white/85" : "bg-white/70"
                                                    }`}>
                                                    <img
                                                        src={CareerpathIcon}
                                                        alt="CareerPath logo"
                                                        className={`object-contain transition-all ${isRobotLive ? "h-12 w-12 lg:h-14 lg:w-14" : "h-11 w-11 lg:h-13 lg:w-13 opacity-80"}`}
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-5 flex w-full items-start justify-center gap-16 lg:gap-18">
                                                <span className="h-20 w-3 rounded-full bg-cyan-200/90 lg:h-24" />
                                                <span className="h-20 w-3 rounded-full bg-cyan-200/90 lg:h-24" />
                                            </div>
                                            <div className="mt-2 flex w-full items-center justify-center gap-14 lg:gap-16">
                                                <span className="h-3.5 w-10 rounded-full bg-white/35 lg:w-12" />
                                                <span className="h-3.5 w-10 rounded-full bg-white/35 lg:w-12" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="overflow-hidden rounded-[1.75rem] border border-sky-100 bg-white shadow-[0_14px_28px_rgba(14,116,144,0.10)]">
                                        <div className="flex items-center justify-between border-b border-sky-100 px-4 py-3">
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                                                    Progress Snapshot
                                                </p>
                                                <h3 className="mt-1 text-base font-black text-slate-900">
                                                    AI-generated roadmap
                                                </h3>
                                            </div>
                                            <MessagesSquare className="h-5 w-5 text-sky-700" />
                                        </div>

                                        <div className="space-y-3 px-4 py-4">
                                            {roadmapSteps.map((step, index) => {
                                                const Icon = step.icon;
                                                return (
                                                    <div key={step.title} className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-800">
                                                            <Icon className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                                                                Step {index + 1}
                                                            </p>
                                                            <p className="mt-1 text-sm font-black text-slate-900">
                                                                {step.title}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="rounded-[1.75rem] border border-sky-100 bg-white p-4 shadow-[0_14px_28px_rgba(14,116,144,0.10)]">
                                        <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#eef8ff_0%,#dff3ff_100%)] p-4">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                                                Learning flow
                                            </p>
                                            <h3 className="mt-2 text-lg font-black text-slate-900">
                                                Assess, build, practice, review
                                            </h3>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                Everything stays connected inside one AI-guided path.
                                            </p>

                                            <div className="mt-4 grid gap-3">
                                                <div className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm font-black text-sky-800">
                                                        1
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                                            Assess
                                                        </p>
                                                        <p className="mt-1 text-sm font-black leading-5 text-slate-900">
                                                            Detect actual skill gaps
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm font-black text-sky-800">
                                                        2
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                                            Build
                                                        </p>
                                                        <p className="mt-1 text-sm font-black leading-5 text-slate-900">
                                                            Generate your lesson path
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm font-black text-sky-800">
                                                        3
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                                            Practice
                                                        </p>
                                                        <p className="mt-1 text-sm font-black leading-5 text-slate-900">
                                                            Learn with guided coaching
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm font-black text-sky-800">
                                                        4
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                                            Review
                                                        </p>
                                                        <p className="mt-1 text-sm font-black leading-5 text-slate-900">
                                                            Adapt based on each quiz
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
