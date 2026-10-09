import {
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/shadcn/component/ui/alert-dialog";
import { Button } from "@/shadcn/component/ui/button";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

type LogoutConfirmDialogProps = {
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
};

export function LogoutConfirmDialog({
    onConfirm,
    onCancel,
    isSubmitting = false,
}: LogoutConfirmDialogProps) {
    const { t } = useTranslation("nav");

    return (
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[540px] rounded-2xl border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="p-5 sm:p-6">
                <AlertDialogHeader className="text-left">
                    <AlertDialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-white">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60 dark:ring-1 dark:ring-rose-800/50">
                            <LogOut className="h-5 w-5 text-rose-700 dark:text-rose-400" />
                        </span>

                        {t("logoutDialog.title", { defaultValue: "Log out" })}
                    </AlertDialogTitle>

                    <AlertDialogDescription className="pt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                        {t("logoutDialog.description", {
                            defaultValue: "Are you sure you want to log out?",
                        })}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="mt-5 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <AlertDialogCancel
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="mt-0 border-slate-200 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-white"
                    >
                        {t("logoutDialog.cancel", { defaultValue: "Cancel" })}
                    </AlertDialogCancel>

                    <Button
                        type="button"
                        variant="destructive"
                        disabled={isSubmitting}
                        onClick={() => {
                            void onConfirm();
                        }}
                        className="bg-rose-600 font-semibold text-white hover:bg-rose-700 disabled:bg-slate-300 dark:bg-rose-600 dark:text-white dark:hover:bg-rose-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                    >
                        {isSubmitting
                            ? t("logoutDialog.loggingOut", { defaultValue: "Logging out..." })
                            : t("logoutDialog.confirm", { defaultValue: "Log out" })}
                    </Button>
                </AlertDialogFooter>
            </div>
        </AlertDialogContent>
    );
}