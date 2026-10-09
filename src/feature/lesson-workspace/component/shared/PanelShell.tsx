import type { ReactNode } from "react";
import { useLessonLanguage } from "../../context/LessonLanguageContext";
import { SECTION_I18N } from "../../util/lessonFormatters";
import type { SectionMeta } from "../../type/lessonWorkspace";

export function SectionButton({
    meta,
    isActive,
    onClick,
}: {
    meta: SectionMeta;
    isActive: boolean;
    onClick: () => void;
}) {
    const { language } = useLessonLanguage();
    const Icon = meta.icon;
    const i18n = SECTION_I18N[meta.key];
    const eyebrow = i18n?.eyebrow[language] || meta.eyebrow;
    const label = i18n?.label[language] || meta.label;

    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "w-full rounded-2xl border px-3 py-3 text-left transition-all sm:px-4",
                isActive
                    ? "border-blue-500 bg-blue-50 text-blue-900 shadow-sm dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:bg-slate-800/80",
            ].join(" ")}
        >
            <div className="flex items-start gap-3">
                <div
                    className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                        isActive
                            ? "border-blue-200 bg-white text-blue-600 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300"
                            : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
                    ].join(" ")}
                >
                    <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        {eyebrow}
                    </p>
                    <p className="mt-1 font-semibold">{label}</p>
                </div>
            </div>
        </button>
    );
}

export function PanelShell({
    eyebrow,
    title,
    note,
    children,
}: {
    eyebrow: string;
    title: string;
    note?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <header className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6 sm:py-5 dark:border-slate-800 dark:bg-slate-800/60">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
                    {eyebrow}
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
                    {title}
                </h2>
                {note ? (
                    <div className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                        {note}
                    </div>
                ) : null}
            </header>
            <div className="space-y-6 p-4 sm:p-6">{children}</div>
        </section>
    );
}

export function EmptyPanel({
    title,
    message,
}: {
    title: string;
    message: string;
}) {
    return (
        <PanelShell eyebrow="Unavailable" title={title}>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 sm:px-6 sm:py-10 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400">
                {message}
            </div>
        </PanelShell>
    );
}
