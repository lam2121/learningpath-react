import {
  GraduationCap,
  BookOpen,
  Target,
  ChevronRight,
  History,
  CircleCheckBig,
  CirclePlay,
  Mail,
} from "lucide-react";
import { Link } from "@tanstack/react-router"
import { useTranslation, Trans } from "react-i18next";
import { TMA_INFO } from "@/const/appConst";

export function Guide() {
  const { t } = useTranslation("guide");

  const steps = t("section3.steps", { returnObjects: true }) as Array<{ number: string; label: string }>;
  const progressItems = t("section4.items", { returnObjects: true }) as string[];
  const stepDetails = t("section3.stepDetails", { returnObjects: true }) as Array<{ label: string; title: string; description: string }>;

  return (
    <main className="flex-1">
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <div className="border-b border-border/40 bg-gradient-to-br from-primary/5 via-background to-blue-50/30 dark:border-slate-800 dark:from-blue-950/20 dark:via-background dark:to-slate-900/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center rounded-md border text-xs font-medium w-fit whitespace-nowrap shrink-0 text-primary border-primary/30 gap-1.5 px-3 py-1 dark:text-blue-400 dark:border-blue-800/60 dark:bg-blue-950/40">
                <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
                {t("badge")}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 text-slate-950 dark:text-white">
              {t("headerTitle")}
            </h1>
            <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-300 max-w-xl leading-relaxed">
              {t("headerDescription")}
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          {/* Section 1: About */}
          <section className="space-y-4 mb-16">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-950 dark:text-white">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center dark:bg-blue-600 dark:text-white">
                1
              </span>
              {t("section1.title")}
            </h2>
            <div className="pl-9">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                <Trans
                  i18nKey="section1.description"
                  ns="guide"
                  components={{ strong: <strong className="font-semibold text-slate-950 dark:text-white" /> }}
                  values={{ name: t("badge") }}
                />
              </p>
            </div>
          </section>

          {/* Section 2: Test Types */}
          <section className="space-y-5 mb-16">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-950 dark:text-white">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center dark:bg-blue-600 dark:text-white">
                2
              </span>
              {t("section2.title")}
            </h2>
            <div className="pl-9 grid gap-4">
              <div className="flex gap-4 p-5 rounded-xl border border-slate-200 bg-card hover:shadow-sm transition-shadow dark:border-slate-800 dark:bg-slate-900/80">
                <div className="p-2.5 rounded-lg bg-blue-500/10 shrink-0 h-fit dark:bg-blue-950/50">
                  <BookOpen
                    className="w-5 h-5 text-blue-500 dark:text-blue-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{t("section2.practice.title")}</span>
                    <span className="inline-flex items-center justify-center rounded-md font-medium w-fit whitespace-nowrap shrink-0 gap-1 text-xs px-2 py-0 h-5 border-0 bg-blue-500/15 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      {t("section2.practice.badge")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {t("section2.practice.description")}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-xl border border-slate-200 bg-card hover:shadow-sm transition-shadow dark:border-slate-800 dark:bg-slate-900/80">
                <div className="p-2.5 rounded-lg bg-amber-500/10 shrink-0 h-fit dark:bg-amber-950/50">
                  <Target
                    className="w-5 h-5 text-amber-500 dark:text-amber-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{t("section2.exam.title")}</span>
                    <span className="inline-flex items-center justify-center rounded-md font-medium w-fit whitespace-nowrap shrink-0 gap-1 text-xs px-2 py-0 h-5 border-0 bg-amber-500/15 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                      {t("section2.exam.badge")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {t("section2.exam.description")}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: How to Take a Test */}
          <section className="space-y-5 mb-16">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-950 dark:text-white">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center dark:bg-blue-600 dark:text-white">
                3
              </span>
              {t("section3.title")}
            </h2>
            <div className="pl-9 space-y-6">
              <div className="flex items-center gap-1 flex-wrap">
                {steps.map((step, index) => (
                  <div className="flex items-center gap-1" key={step.number}>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60 dark:bg-slate-800/90 dark:border dark:border-slate-700/60">
                      <span className="text-xs font-bold text-primary dark:text-blue-400">
                        {step.number}
                      </span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <ChevronRight
                        className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-4 text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                {stepDetails.map((detail, index) => (
                  <div className="flex gap-3" key={index}>
                    <span className="font-bold text-primary dark:text-blue-400 shrink-0">
                      {detail.label}
                    </span>
                    <p>
                      <Trans
                        i18nKey={`section3.stepDetails.${index}.description`}
                        ns="guide"
                        components={{ strong: <strong className="font-semibold text-slate-950 dark:text-white" /> }}
                        values={{ title: detail.title }}
                      />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 4: Learning Progress */}
          <section className="space-y-5 mb-16">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-950 dark:text-white">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center dark:bg-blue-600 dark:text-white">
                4
              </span>
              {t("section4.title")}
            </h2>
            <div className="pl-9">
              <div className="flex gap-4 p-5 rounded-xl border border-slate-200 bg-card dark:border-slate-800 dark:bg-slate-900/80">
                <div className="p-2.5 rounded-lg bg-muted shrink-0 h-fit dark:bg-slate-800">
                  <History
                    className="w-5 h-5 text-slate-600 dark:text-slate-300"
                    aria-hidden="true"
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                    <Trans
                      i18nKey="section4.description"
                      ns="guide"
                      components={{ strong: <strong className="font-semibold text-slate-950 dark:text-white" /> }}
                      values={{ title: t("section4.title") }}
                    />
                  </p>
                  <ul className="space-y-2">
                    {progressItems.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        <CircleCheckBig
                          className="w-4 h-4 text-green-500 dark:text-emerald-400 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="flex items-center gap-4 p-6 rounded-xl bg-primary/5 border border-primary/20 mb-16 dark:bg-blue-950/30 dark:border-blue-900/40">
            <div className="p-3 bg-primary rounded-lg text-primary-foreground shrink-0 dark:bg-blue-600 dark:text-white">
              <CirclePlay className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-slate-950 dark:text-white">{t("cta.title")}</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                <Trans
                  i18nKey="cta.description"
                  ns="guide"
                  components={{ 1: <Link to="/login" className="text-primary dark:text-blue-400 font-medium hover:underline" /> }}
                />
              </p>
            </div>
          </div>

          {/* Feedback */}
          <div className="flex items-center gap-4 p-5 rounded-xl border border-dashed border-muted-foreground/25 bg-muted/20 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="p-2.5 rounded-lg bg-muted shrink-0 dark:bg-slate-800">
              <Mail
                className="w-5 h-5 text-slate-600 dark:text-slate-300"
                aria-hidden="true"
              />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
              {t("feedback.title")}{" "}
              {t("feedback.description")}{" "}
              {t("feedback.contactPrefix")}{" "}
              <Link
                to={`mailto:${TMA_INFO.supportEmail}`}
                className="text-primary dark:text-blue-400 font-medium hover:underline"
              >
                {TMA_INFO.supportEmail}
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
