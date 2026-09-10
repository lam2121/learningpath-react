import { APP_INFO } from "@/const/appConst";

export function MainFooter() {
    return (
        <footer className="bg-primary text-primary-foreground border-t border-primary-foreground/10">
            <div className="container mx-auto px-6 py-6 relative flex items-center justify-between">
                <div className="text-xs text-primary-foreground/70">
                    &copy; {new Date().getFullYear()} {APP_INFO.name}. All rights reserved.
                </div>

                <div className="flex items-center gap-5">
                    <a
                        href="/guide"
                        className="text-xs text-primary-foreground/60 hover:text-primary-foreground transition-colors duration-150 hover:underline underline-offset-4"
                    >
                        User Guide
                    </a>
                    <a
                        href="/lessons/learning-path"
                        className="text-xs text-primary-foreground/60 hover:text-primary-foreground transition-colors duration-150 hover:underline underline-offset-4"
                    >
                        Learning Path
                    </a>
                </div>
            </div>
        </footer>
    );
}
