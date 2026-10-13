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
                "w-full rounded-2xl border px-3 py-3 text-left transition-all sm:px-4 card-interactive-subtle",
                isActive
                    ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20 dark:bg-primary/20"
                    : "border-border/70 bg-card text-foreground hover:border-border hover:bg-accent/40",
            ].join(" ")}
        >
            <div className="flex items-start gap-3">
                <div
                    className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                        isActive
                            ? "border-primary bg-primary text-primary-foreground shadow-xs"
                            : "border-border bg-muted/40 text-muted-foreground",
                    ].join(" ")}
                >
                    <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {eyebrow}
                    </p>
                    <p className="mt-1 font-bold">{label}</p>
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
        <section className="rounded-3xl border border-border/80 bg-card shadow-xs transition-shadow duration-300 hover:shadow-md">
            <header className="border-b border-border/60 bg-accent/30 px-4 py-4 sm:px-6 sm:py-5 rounded-t-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
                    {eyebrow}
                </p>
                <h2 className="font-display mt-2 text-xl font-bold text-foreground sm:text-2xl">
                    {title}
                </h2>
                {note ? (
                    <div className="mt-2 text-sm font-medium text-muted-foreground">
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
            <div className="rounded-2xl border border-dashed border-border/80 bg-accent/20 px-4 py-8 text-center text-sm text-muted-foreground sm:px-6 sm:py-10">
                {message}
            </div>
        </PanelShell>
    );
}
