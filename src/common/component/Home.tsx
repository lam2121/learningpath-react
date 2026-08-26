import { Link } from "@tanstack/react-router";
import {
    ArrowRight,
    BriefcaseBusiness,
    Check,
    ChevronRight,
    ClipboardCheck,
    Compass,
    FileCheck2,
    Route,
    Sparkles,
} from "lucide-react";

import CareerpathIcon from "@/asset/image/careerpath_logo.png";

const journey = [
    { label: "Choose role", icon: BriefcaseBusiness },
    { label: "Find gaps", icon: ClipboardCheck },
    { label: "Follow 8 topics", icon: Route },
    { label: "Pass Final Test", icon: FileCheck2 },
] as const;

function CareerPathRobot() {
    return (
        <div
            // Đã cập nhật:
            // - Tăng mt-20 -> mt-24 (mobile) và mt-24 -> mt-28 (PC) để đẩy cách xa khung chữ phía trên hơn.
            // - Giảm pb-16 -> pb-8 (mobile) và pb-20 -> pb-12 (PC) để hạ chân robot xuống thấp hơn.
            // - Nếu muốn xuống thấp nữa, bạn cứ tiếp tục giảm số của thẻ "pb" (ví dụ pb-4) nhé.
            className="relative z-40 mx-auto mt-24 mb-6 flex h-[320px] items-end justify-center pb-8 sm:mt-28 sm:mb-8 sm:h-[390px] sm:pb-12"
            role="img"
            aria-label="Friendly CareerPath learning robot"
        >
            <div className="relative flex origin-bottom scale-[0.68] flex-col items-center sm:scale-[0.8]">
                {/* Giữ nguyên toàn bộ code cấu tạo robot ở bên trong */}
                <div className="relative h-40 w-40 rounded-[2.7rem] border border-white/60 bg-[linear-gradient(180deg,#e8fbff_0%,#9be3ff_42%,#38bdf8_100%)] shadow-[0_18px_40px_rgba(34,211,238,0.4)]">
                    <div className="absolute left-1/2 top-[-1.15rem] h-7 w-[3px] -translate-x-1/2 rounded-full bg-cyan-300" />
                    <div className="absolute left-1/2 top-[-1.55rem] h-5 w-5 -translate-x-1/2 rounded-full border border-white bg-white shadow-[0_0_16px_rgba(34,211,238,0.7)]" />
                    <div className="absolute left-1/2 top-4 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-white/80" />

                    <div className="absolute left-8 top-12 flex h-6 w-6 items-center justify-center rounded-full bg-[#003d6d]">
                        <span className="h-2 w-2 rounded-full bg-white" />
                    </div>
                    <div className="absolute right-8 top-12 flex h-6 w-6 items-center justify-center rounded-full bg-[#003d6d]">
                        <span className="h-2 w-2 rounded-full bg-white" />
                    </div>

                    <div className="absolute left-9 top-[5rem] h-3 w-4 rounded-full bg-pink-100/90" />
                    <div className="absolute right-9 top-[5rem] h-3 w-4 rounded-full bg-pink-100/90" />
                    <div className="absolute left-1/2 top-[5.45rem] h-3.5 w-12 -translate-x-1/2 rounded-full border-b-[3px] border-[#005596]" />
                    <div className="absolute left-1/2 top-[6.4rem] h-2 w-9 -translate-x-1/2 rounded-full bg-white/20" />

                    <div className="absolute -left-3 top-14 h-12 w-3.5 rounded-full bg-cyan-300" />
                    <div className="absolute -right-3 top-14 h-12 w-3.5 rounded-full bg-cyan-300" />
                    <div className="absolute -left-6 top-[6.4rem] h-3 w-8 rounded-full bg-cyan-200" />
                    <div className="absolute -right-6 top-[6.4rem] h-3 w-8 rounded-full bg-cyan-200" />
                </div>

                <div className="mt-6 flex h-32 w-36 items-center justify-center rounded-[2.1rem] border border-white/60 bg-[linear-gradient(180deg,#8fe3ff_0%,#22d3ee_100%)] shadow-[0_14px_28px_rgba(34,211,238,0.28)] lg:h-36 lg:w-40">
                    <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.35rem] bg-white/90 shadow-[0_8px_18px_rgba(255,255,255,0.3)]">
                        <img
                            src={CareerpathIcon}
                            alt=""
                            className="h-12 w-12 object-contain lg:h-14 lg:w-14"
                        />
                    </div>
                </div>

                <div className="mt-5 flex w-full items-start justify-center gap-16">
                    <span className="h-20 w-3 rounded-full bg-cyan-300 lg:h-24" />
                    <span className="h-20 w-3 rounded-full bg-cyan-300 lg:h-24" />
                </div>
                <div className="mt-2 flex w-full items-center justify-center gap-14">
                    <span className="h-3.5 w-10 rounded-full bg-[#0072bb]/45 lg:w-12" />
                    <span className="h-3.5 w-10 rounded-full bg-[#0072bb]/45 lg:w-12" />
                </div>
            </div>
        </div>
    );
}

export function Home() {
    return (
        <main className="relative min-h-[100svh] overflow-x-hidden bg-[#f5fbff] text-slate-950 lg:h-[100svh] lg:min-h-[700px] lg:overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,114,187,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(0,114,187,0.028)_1px,transparent_1px)] bg-[size:44px_44px]" />
            <div className="pointer-events-none absolute -left-28 top-20 h-80 w-80 rounded-full bg-cyan-300/25 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 top-8 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />

            <section
                id="top"
                className="relative mx-auto grid w-full max-w-[1360px] gap-8 px-5 py-6 sm:px-8 lg:h-[calc(100%-72px)] lg:grid-cols-[minmax(0,1.18fr)_minmax(400px,0.82fr)] lg:items-center lg:px-10 lg:py-4 xl:gap-12"
            >
                <div className="relative z-10 max-w-[920px]">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/90 px-4 py-2 text-[11px] font-black uppercase tracking-[0.17em] text-[#006890] shadow-[0_10px_26px_rgba(0,114,187,0.08)]">
                        <Sparkles className="h-4 w-4" />
                        Role-specific professional English
                    </div>

                    <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.1] tracking-[-0.055em] sm:text-5xl xl:text-[3.7rem]">
                        Know exactly what English
                        <span className="mt-2 block pb-2 bg-[linear-gradient(135deg,#005596_0%,#0072bb_48%,#00a9ce_100%)] bg-clip-text text-transparent">
                            to learn for your career.
                        </span>
                    </h1>

                    <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                        A fair placement test finds your real gaps across four workplace skills, then builds an 8-topic roadmap around your profession and level.
                    </p>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Link
                            to="/login"
                            className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#005596,#0072bb_60%,#009fc7)] px-6 text-base font-black text-white shadow-[0_18px_38px_rgba(0,114,187,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(0,114,187,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072bb] focus-visible:ring-offset-3"
                        >
                            Start my placement test
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                        <Link
                            to="/guide"
                            className="inline-flex min-h-13 items-center justify-center gap-1 rounded-2xl border border-[#0072bb]/20 bg-white/90 px-5 text-sm font-black text-[#005596] shadow-sm transition hover:-translate-y-0.5 hover:border-[#0072bb]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072bb] focus-visible:ring-offset-3"
                        >
                            How it works
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-slate-600 sm:text-sm">
                        {["48-question diagnostic", "4 core skills", "No credit card"].map((item) => (
                            <span key={item} className="inline-flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                    <Check className="h-3.5 w-3.5" />
                                </span>
                                {item}
                            </span>
                        ))}
                    </div>

                    <div className="mt-6 rounded-[1.6rem] border border-white bg-white/80 p-4 shadow-[0_16px_38px_rgba(0,85,150,0.08)] backdrop-blur">
                        <div className="mb-3 flex items-center justify-between gap-3 px-1">
                            <p className="text-[11px] font-black uppercase tracking-[0.17em] text-[#0072bb] sm:text-xs">One clear journey</p>
                            <p className="text-[11px] font-bold text-slate-400 sm:text-xs">No hidden graduation rules</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {journey.map((step, index) => {
                                const StepIcon = step.icon;
                                return (
                                    <div key={step.label} className="flex min-w-0 items-center gap-3 rounded-2xl bg-cyan-50/80 px-3.5 py-3 ring-1 ring-cyan-100">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0072bb] shadow-sm">
                                            <StepIcon className="h-4.5 w-4.5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-700/60">0{index + 1}</p>
                                            <p className="text-[11px] font-black leading-tight text-slate-800 sm:text-xs">{step.label}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mx-auto w-full max-w-[570px] lg:ml-auto">
                    <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-[linear-gradient(135deg,rgba(103,232,249,0.5),rgba(186,230,253,0.08),rgba(147,197,253,0.46))] blur-2xl" />
                    <div className="relative flex min-h-[500px] flex-col overflow-hidden rounded-[2.25rem] border border-white/90 bg-[linear-gradient(145deg,#ffffff_0%,#edfaff_52%,#dff4ff_100%)] px-6 pb-6 pt-6 shadow-[0_30px_80px_rgba(0,85,150,0.18)] sm:min-h-[560px] sm:px-8 sm:pt-8">
                        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-300/30 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />

                        <div className="relative z-30 max-w-[292px] rounded-[1.2rem] border border-cyan-100 bg-white/90 px-3.5 py-3 shadow-[0_16px_38px_rgba(0,85,150,0.12)] backdrop-blur sm:px-4 sm:py-3.5">
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-[#0072bb] sm:text-[10px]">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-50 text-[#0072bb]">
                                    <Sparkles className="h-3.5 w-3.5" />
                                </span>
                                Your learning companion
                            </div>
                            <h2 className="mt-1.5 text-[1.28rem] font-black tracking-[-0.04em] text-slate-950 sm:text-[1.5rem]">Hi! Ready to find your path?</h2>
                            <p className="mt-1.5 text-[13px] font-semibold leading-5 text-slate-600 sm:text-sm">I’ll help you turn your real English gaps into clear, achievable steps.</p>
                        </div>

                        <div className="absolute right-5 top-6 z-30 hidden items-center gap-2 rounded-full border border-white bg-white/80 px-3.5 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#005596] shadow-sm sm:flex">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.13)]" />
                            Here to help
                        </div>

                        {/* Robot now grows to fill the space between the bubble and the bottom bar, instead of overflowing behind it */}
                        <div className="relative z-0 flex flex-1 items-center justify-center">
                            <CareerPathRobot />
                        </div>

                        {/* No longer absolute — now a normal flex child, so it can never overlap the robot */}
                        <div className="relative z-10 flex items-center justify-between gap-3 rounded-2xl border border-white bg-[#005596]/95 px-4 py-3.5 text-white shadow-[0_16px_32px_rgba(0,85,150,0.24)] backdrop-blur">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/12 text-cyan-200 ring-1 ring-white/15">
                                <Compass className="h-5.5 w-5.5" />
                            </span>
                            <Link to="/login">
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Your goal, your pace</p>
                                    <p className="mt-0.5 text-base font-bold text-white">Let’s take the first step together.</p>
                                </div>
                            </Link>
                            <ChevronRight className="h-4.5 w-4.5 shrink-0 text-cyan-200" />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Home;