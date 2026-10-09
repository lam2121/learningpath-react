import { useTranslation } from "react-i18next";
import { TMA_INFO } from "../../const/appConst";

export function MainFooter() {
    const { t } = useTranslation("nav");

    return (
        <footer className="bg-primary text-primary-foreground border-t border-primary-foreground/10 dark:bg-slate-950 dark:border-slate-800/80 dark:text-slate-400">
            <div className="container mx-auto px-6 py-6 relative flex items-center justify-between">

                {/* Logo + Copyright */}

                {/* Links - centered absolutely */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-5">
                    {[
                        { href: TMA_INFO.HOME_PAGE, label: t("trainingTool", { defaultValue: "Training Tool" }) },
                        { href: TMA_INFO.SMART_LEARNING, label: t("smartLearning", { defaultValue: "Smart-Learning" }) },
                    ].map(({ href, label }) => (
                        <a
                            key={label}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-foreground/60 hover:text-primary-foreground transition-colors duration-150 hover:underline underline-offset-4 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                            {label}
                        </a>
                    ))}
                </div>

            </div>
        </footer>
    );
}
