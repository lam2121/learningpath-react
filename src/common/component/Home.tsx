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
import { useTranslation } from "react-i18next";

import CareerpathIcon from "@/asset/image/careerpath_logo.png";
import { useAuth } from "@/common/context/AuthContext";

const journey = [
    { labelKey: "journeySteps.step1", defaultLabel: "Choose role", icon: BriefcaseBusiness },
    { labelKey: "journeySteps.step2", defaultLabel: "Find gaps", icon: ClipboardCheck },
    { labelKey: "journeySteps.step3", defaultLabel: "Follow 8 topics", icon: Route },
    { labelKey: "journeySteps.step4", defaultLabel: "Pass Final Test", icon: FileCheck2 },
] as const;

const features = [
    { key: "feature1", defaultText: "48-question diagnostic" },
    { key: "feature2", defaultText: "4 core skills" },
    { key: "feature3", defaultText: "No credit card" },
] as const;

function CareerPathRobot({ ariaLabel }: { ariaLabel: string }) {
    return (
        <div
            // Đã cập nhật:
            // - Tăng mt-20 -> mt-24 (mobile) và mt-24 -> mt-28 (PC) để đẩy cách xa khung chữ phía trên hơn.
            // - Giảm pb-16 -> pb-8 (mobile) và pb-20 -> pb-12 (PC) để hạ chân robot xuống thấp hơn.
            // - Nếu muốn xuống thấp nữa, bạn cứ tiếp tục giảm số của thẻ "pb" (ví dụ pb-4) nhé.
            className="relative z-40 mx-auto mt-24 mb-6 flex h-[320px] items-end justify-center pb-8 sm:mt-28 sm:mb-8 sm:h-[390px] sm:pb-12"
            role="img"
            aria-label={ariaLabel}
        >
            <div className="relative flex origin-bottom scale-[0.68] flex-col items-center sm:scale-[0.8]">
                {/* Giữ nguyên toàn bộ code cấu tạo robot ở bên trong */}
                <div className="relative h-40 w-40 rounded-[2.7rem] border border-white/60 bg-[linear-gradient(180deg,#e8fbff_0%,#9be3ff_42%,#38bdf8_100%)] shadow-[0_18px_40px_rgba(34,211,238,0.4)]">
                    <div className="absolute left-1/2 top-[-1.15rem] h-7 w-[3px] -translate-x-1/2 rounded-full bg-cyan-300" />
                    <div className="absolute left-1/2 top-[-1.55rem] h-5 w-5 -translate-x-1/2 rounded-full border border-white bg-white shadow-[0_0_16px_rgba(34,211,238,0.7)]" />
                    <div className="absolute left-1/2 top-4 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-white/80" />

                    <div
                        className="absolute left-8 top-12 flex h-6 w-6 origin-center items-center justify-center rounded-full bg-[#003d6d] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                        style={{ animation: 'robotEyeBlink 4.2s infinite ease-in-out' }}
                    >
                        <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.95)]" />
                        <span className="absolute bottom-1 right-1.5 h-1 w-1 rounded-full bg-cyan-200" />
                    </div>
                    <div
                        className="absolute right-8 top-12 flex h-6 w-6 origin-center items-center justify-center rounded-full bg-[#003d6d] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                        style={{ animation: 'robotEyeBlink 4.2s infinite ease-in-out' }}
                    >
                        <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.95)]" />
                        <span className="absolute bottom-1 right-1.5 h-1 w-1 rounded-full bg-cyan-200" />
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

                {/* BODY & ARMS */}
                <div className="relative mt-6 flex h-32 w-36 items-center justify-center rounded-[2.1rem] border border-white/60 bg-[linear-gradient(180deg,#8fe3ff_0%,#22d3ee_100%)] shadow-[0_14px_28px_rgba(34,211,238,0.28)] lg:h-36 lg:w-40">
                    {/* LEFT ARM (Friendly Waving) */}
                    <div className="absolute -left-3.5 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(135deg,#e8fbff_0%,#9be3ff_100%)] shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-cyan-400" />
                    </div>
                    <div
                        className="pointer-events-none absolute -left-10 -top-8 z-20 flex origin-bottom-right flex-col items-center"
                        style={{ animation: 'robotWave 2.8s ease-in-out infinite' }}
                    >
                        {/* Waving Hand */}
                        <div className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white shadow-[0_4px_12px_rgba(34,211,238,0.45)]">
                            <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                            {/* Thumb */}
                            <div className="absolute -right-1 top-2 h-3 w-2 rounded-full border border-white bg-white shadow-xs" />
                            {/* Fingertip accent */}
                            <div className="absolute -top-1 left-2 h-1.5 w-1.5 rounded-full bg-cyan-200" />
                        </div>
                        {/* Upper Arm & Forearm Limb */}
                        <div className="mt-[-2px] h-12 w-3.5 rounded-full border border-white/70 bg-[linear-gradient(180deg,#c7f3ff_0%,#67e8f9_50%,#22d3ee_100%)] shadow-sm" />
                    </div>

                    {/* RIGHT ARM (Resting / Welcoming) */}
                    <div className="absolute -right-3.5 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(135deg,#e8fbff_0%,#9be3ff_100%)] shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-cyan-400" />
                    </div>
                    <div
                        className="pointer-events-none absolute -right-8 top-7 z-20 flex origin-top-left flex-col items-center"
                        style={{ animation: 'rightArmSway 2.8s ease-in-out infinite' }}
                    >
                        {/* Arm Limb */}
                        <div className="h-13 w-3.5 rounded-full border border-white/70 bg-[linear-gradient(180deg,#22d3ee_0%,#67e8f9_50%,#c7f3ff_100%)] shadow-sm" />
                        {/* Hand */}
                        <div className="relative mt-[-2px] flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white shadow-[0_4px_12px_rgba(34,211,238,0.45)]">
                            <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                            {/* Thumb */}
                            <div className="absolute -left-1 top-2 h-3 w-2 rounded-full border border-white bg-white shadow-xs" />
                        </div>
                    </div>

                    {/* Logo screen on chest */}
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
                    <span className="h-3.5 w-10 rounded-full bg-[#0072bb]/45 lg:w-12 dark:bg-cyan-400/40" />
                    <span className="h-3.5 w-10 rounded-full bg-[#0072bb]/45 lg:w-12 dark:bg-cyan-400/40" />
                </div>
            </div>

            <style>{`
                @keyframes robotWave {
                    0%, 100% {
                        transform: rotate(-20deg);
                    }
                    50% {
                        transform: rotate(-36deg);
                    }
                }
                @keyframes rightArmSway {
                    0%, 100% {
                        transform: rotate(10deg);
                    }
                    50% {
                        transform: rotate(18deg);
                    }
                }
                @keyframes robotEyeBlink {
                    0%, 88%, 93%, 100% {
                        transform: scaleY(1);
                    }
                    90% {
                        transform: scaleY(0.08);
                    }
                    92% {
                        transform: scaleY(1);
                    }
                    94.5% {
                        transform: scaleY(0.08);
                    }
                }
            `}</style>
        </div>
    );
}

export function Home() {
    const { t } = useTranslation("home");
    const { isAuthenticated, user } = useAuth();
    const primaryTarget = isAuthenticated
        ? user?.role_id === 2
            ? "/admin"
            : "/lessons/learning-path"
        : "/login";

    return (
        <main className="relative min-h-screen bg-[#f5fbff] text-slate-950 dark:bg-slate-950 dark:text-white">
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,114,187,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(0,114,187,0.028)_1px,transparent_1px)] bg-[size:44px_44px] dark:bg-[linear-gradient(rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.03)_1px,transparent_1px)]" />
                <div className="absolute -left-28 top-20 h-80 w-80 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-500/10" />
                <div className="absolute -right-24 top-8 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl dark:bg-blue-600/10" />
            </div>

            <section
                id="top"
                className="relative mx-auto grid w-full max-w-[1360px] gap-8 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(400px,0.82fr)] lg:items-center lg:px-10 lg:py-8 xl:gap-12"
            >
                <div className="relative z-10 max-w-[920px]">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/90 px-4 py-2 text-[11px] font-black uppercase tracking-[0.17em] text-[#006890] shadow-[0_10px_26px_rgba(0,114,187,0.08)] dark:border-cyan-900/60 dark:bg-slate-900/90 dark:text-cyan-400 dark:shadow-[0_10px_26px_rgba(0,0,0,0.3)]">
                        <Sparkles className="h-4 w-4" />
                        {t("badge", { defaultValue: "Role-specific professional English" })}
                    </div>

                    <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.1] tracking-[-0.055em] sm:text-5xl xl:text-[3.7rem]">
                        {t("heroTitle", { defaultValue: "Know exactly what English" })}
                        <span className="mt-2 block pb-2 bg-[linear-gradient(135deg,#005596_0%,#0072bb_48%,#00a9ce_100%)] bg-clip-text text-transparent dark:bg-[linear-gradient(135deg,#38bdf8_0%,#60a5fa_50%,#93c5fd_100%)]">
                            {t("heroTitleGradient", { defaultValue: "to learn for your career." })}
                        </span>
                    </h1>

                    <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 dark:text-slate-300">
                        {t("heroDescription", {
                            defaultValue:
                                "A fair placement test finds your real gaps across four workplace skills, then builds an 8-topic roadmap around your profession and level.",
                        })}
                    </p>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Link
                            to={primaryTarget}
                            className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#005596,#0072bb_60%,#009fc7)] px-6 text-base font-black text-white shadow-[0_18px_38px_rgba(0,114,187,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(0,114,187,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072bb] focus-visible:ring-offset-3 dark:shadow-[0_18px_38px_rgba(14,165,233,0.2)] dark:hover:shadow-[0_22px_42px_rgba(14,165,233,0.3)]"
                        >
                            {isAuthenticated ? t("continue", { defaultValue: "Continue" }) : t("startTest", { defaultValue: "Start my placement test" })}
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                        <Link
                            to="/guide"
                            className="inline-flex min-h-13 items-center justify-center gap-1 rounded-2xl border border-[#0072bb]/20 bg-white/90 px-5 text-sm font-black text-[#005596] shadow-sm transition hover:-translate-y-0.5 hover:border-[#0072bb]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072bb] focus-visible:ring-offset-3 dark:border-slate-800 dark:bg-slate-900/90 dark:text-cyan-400 dark:hover:border-cyan-700/60 dark:hover:bg-slate-800/90"
                        >
                            {t("howItWorks", { defaultValue: "How it works" })}
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-slate-600 sm:text-sm dark:text-slate-400">
                        {features.map((item) => (
                            <span key={item.key} className="inline-flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 dark:ring-1 dark:ring-emerald-800/50">
                                    <Check className="h-3.5 w-3.5" />
                                </span>
                                {t(item.key, { defaultValue: item.defaultText })}
                            </span>
                        ))}
                    </div>

                    <div className="mt-6 rounded-[1.6rem] border border-white bg-white/80 p-4 shadow-[0_16px_38px_rgba(0,85,150,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-[0_16px_38px_rgba(0,0,0,0.3)]">
                        <div className="mb-3 flex items-center justify-between gap-3 px-1">
                            <p className="text-[11px] font-black uppercase tracking-[0.17em] text-[#0072bb] sm:text-xs dark:text-cyan-400">
                                {t("journeyTitle", { defaultValue: "One clear journey" })}
                            </p>
                            <p className="text-[11px] font-bold text-slate-400 sm:text-xs dark:text-slate-500">
                                {t("journeySubtitle", { defaultValue: "No hidden graduation rules" })}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {journey.map((step, index) => {
                                const StepIcon = step.icon;
                                return (
                                    <div key={step.labelKey} className="flex min-w-0 items-center gap-3 rounded-2xl bg-cyan-50/80 px-3.5 py-3 ring-1 ring-cyan-100 dark:bg-slate-800/80 dark:ring-slate-700/60">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0072bb] shadow-sm dark:bg-slate-900 dark:text-cyan-400 dark:ring-1 dark:ring-slate-700/50">
                                            <StepIcon className="h-4.5 w-4.5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-700/60 dark:text-cyan-400/70">0{index + 1}</p>
                                            <p className="text-[11px] font-black leading-tight text-slate-800 sm:text-xs dark:text-slate-200">
                                                {t(step.labelKey, { defaultValue: step.defaultLabel })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mx-auto w-full max-w-[570px] lg:ml-auto">
                    <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-[linear-gradient(135deg,rgba(103,232,249,0.5),rgba(186,230,253,0.08),rgba(147,197,253,0.46))] blur-2xl dark:bg-[linear-gradient(135deg,rgba(14,165,233,0.18),rgba(30,41,59,0.1),rgba(59,130,246,0.15))]" />
                    <div className="relative flex min-h-[500px] flex-col overflow-hidden rounded-[2.25rem] border border-white/90 bg-[linear-gradient(145deg,#ffffff_0%,#edfaff_52%,#dff4ff_100%)] px-6 pb-6 pt-6 shadow-[0_30px_80px_rgba(0,85,150,0.18)] sm:min-h-[560px] sm:px-8 sm:pt-8 dark:border-slate-800 dark:bg-[linear-gradient(145deg,#0f172a_0%,#090d16_52%,#0f172a_100%)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
                        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-300/30 blur-2xl dark:bg-cyan-500/10" />
                        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl dark:bg-blue-600/10" />

                        <div className="relative z-30 flex items-start justify-between gap-3">
                            <div className="min-w-0 max-w-[292px] rounded-[1.2rem] border border-cyan-100 bg-white/90 px-3.5 py-3 shadow-[0_16px_38px_rgba(0,85,150,0.12)] backdrop-blur sm:px-4 sm:py-3.5 dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-[0_16px_38px_rgba(0,0,0,0.3)]">
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-[#0072bb] sm:text-[10px] dark:text-cyan-400">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-[#0072bb] dark:bg-slate-800 dark:text-cyan-400">
                                        <Sparkles className="h-3.5 w-3.5" />
                                    </span>
                                    {t("companionBadge", { defaultValue: "Your learning companion" })}
                                </div>
                                <h2 className="mt-1.5 text-[1.28rem] font-black tracking-[-0.04em] text-slate-950 sm:text-[1.5rem] dark:text-white">
                                    {t("companionTitle", { defaultValue: "Hi! Ready to find your path?" })}
                                </h2>
                                <p className="mt-1.5 text-[13px] font-semibold leading-5 text-slate-600 sm:text-sm dark:text-slate-300">
                                    {t("companionDescription", {
                                        defaultValue: "I'll help you turn your real English gaps into clear, achievable steps.",
                                    })}
                                </p>
                            </div>

                            <div className="hidden shrink-0 items-center gap-2 rounded-full border border-white bg-white/80 px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#005596] shadow-sm sm:flex dark:border-slate-700 dark:bg-slate-900/80 dark:text-cyan-400">
                                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.13)]" />
                                {t("hereToHelp", { defaultValue: "Here to help" })}
                            </div>
                        </div>

                        {/* Robot now grows to fill the space between the bubble and the bottom bar, instead of overflowing behind it */}
                        <div className="relative z-0 flex flex-1 items-center justify-center">
                            <CareerPathRobot ariaLabel={t("robotAriaLabel", { defaultValue: "Friendly CareerPath learning robot" })} />
                        </div>

                        {/* No longer absolute — now a normal flex child, so it can never overlap the robot */}
                        <div className="relative z-10 flex items-center justify-between gap-3 rounded-2xl border border-white bg-[#005596]/95 px-4 py-3.5 text-white shadow-[0_16px_32px_rgba(0,85,150,0.24)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(0,114,187,0.32)] dark:border-slate-700 dark:bg-slate-800/95 dark:shadow-[0_16px_32px_rgba(0,0,0,0.35)] dark:hover:bg-slate-800 dark:hover:shadow-[0_22px_42px_rgba(14,165,233,0.2)]">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/12 text-cyan-200 ring-1 ring-white/15 dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-400/20">
                                <Compass className="h-5.3 w-5.3" />
                            </span>
                            <Link to={primaryTarget}>
                                <div className="min-w-0 flex-1 ">
                                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200 dark:text-cyan-300">
                                        {t("ctaSubtitle", { defaultValue: "Your goal, your pace" })}
                                    </p>
                                    <p className="mt-0.5 text-base font-bold text-white">
                                        {t("ctaTitle", { defaultValue: "Let’s take the first step together." })}
                                    </p>
                                </div>
                            </Link>
                            <ChevronRight className="h-4.5 w-4.5 shrink-0 text-cyan-200 dark:text-cyan-300" />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Home;