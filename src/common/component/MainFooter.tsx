import { TMA_INFO, APP_INFO } from "../../const/appConst";

export function MainFooter() {
    return (
        <footer className="hidden md:block bg-primary text-primary-foreground border-t border-primary-foreground/10 dark:bg-slate-950 dark:border-slate-800/80 dark:text-slate-400">
            <div className="container mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-primary-foreground/70 dark:text-slate-400">
                    © {new Date().getFullYear()} {APP_INFO.name} · AI Learning Path. Built by Lam.
                </div>
                <div className="flex items-center gap-5">
                    <a
                        href={TMA_INFO.HOME_PAGE}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-foreground/70 hover:text-primary-foreground transition-colors duration-150 hover:underline underline-offset-4 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                        {TMA_INFO.domain}
                    </a>
                    <a
                        href={`mailto:${TMA_INFO.supportEmail}`}
                        className="text-xs text-primary-foreground/70 hover:text-primary-foreground transition-colors duration-150 hover:underline underline-offset-4 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                        {TMA_INFO.supportEmail}
                    </a>
                </div>
            </div>
        </footer>
    );
}
