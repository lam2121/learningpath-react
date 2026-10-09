import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

export type LessonLanguage = "en" | "vi" | "ja";

interface LessonLanguageContextType {
    language: LessonLanguage;
    setLanguage: (lang: LessonLanguage) => void;
    showFurigana: boolean;
    setShowFurigana: (show: boolean) => void;
    getLocalizedText: (
        item: { en?: string; vi?: string; ja?: string } | string | null | undefined,
        fallback?: string,
    ) => string;
}

const STORAGE_FURIGANA_KEY = "careerpath_show_furigana";

const LessonLanguageContext = createContext<LessonLanguageContextType | undefined>(undefined);

export const mapI18nToLessonLanguage = (lang: string | undefined): LessonLanguage => {
    if (!lang) return "en";
    const lower = lang.toLowerCase();
    if (lower.startsWith("vi")) return "vi";
    if (lower.startsWith("ja") || lower.startsWith("jp")) return "ja";
    return "en";
};

export const LessonLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { i18n } = useTranslation();

    // Map the global i18n language ('en', 'vi', 'jp' / 'ja') to LessonLanguage ('en' | 'vi' | 'ja')
    const [language, setLanguageState] = useState<LessonLanguage>(() => {
        const globalLang = localStorage.getItem("app_language") || i18n.language;
        return mapI18nToLessonLanguage(globalLang);
    });

    const [showFurigana, setShowFuriganaState] = useState<boolean>(() => {
        const saved = localStorage.getItem(STORAGE_FURIGANA_KEY);
        return saved === null ? true : saved === "true";
    });

    // Synchronize whenever i18n.language changes globally (e.g. from MainNavigationMenu)
    useEffect(() => {
        const syncLanguage = (lng?: string) => {
            const currentGlobal = lng || i18n.language || localStorage.getItem("app_language") || "en";
            const target = mapI18nToLessonLanguage(currentGlobal);
            setLanguageState(target);
        };

        syncLanguage(i18n.language);

        i18n.on("languageChanged", syncLanguage);

        const handleCustomEvent = (e: Event) => {
            const detail = (e as CustomEvent<string>).detail;
            syncLanguage(detail);
        };
        window.addEventListener("careerpath:language-changed", handleCustomEvent);

        return () => {
            i18n.off("languageChanged", syncLanguage);
            window.removeEventListener("careerpath:language-changed", handleCustomEvent);
        };
    }, [i18n]);

    const setLanguage = (lang: LessonLanguage) => {
        const i18nCode = lang === "ja" ? "jp" : lang;
        i18n.changeLanguage(i18nCode);
        localStorage.setItem("app_language", i18nCode);
        setLanguageState(lang);
        window.dispatchEvent(new CustomEvent("careerpath:language-changed", { detail: i18nCode }));
    };

    const setShowFurigana = (show: boolean) => {
        setShowFuriganaState(show);
        localStorage.setItem(STORAGE_FURIGANA_KEY, String(show));
    };

    /**
     * Helper to safely extract string from trilingual object `{en, vi, ja}` or plain string.
     */
    const getLocalizedText = useMemo(
        () =>
            (
                item: { en?: string; vi?: string; ja?: string } | string | null | undefined,
                fallback: string = "",
            ): string => {
                if (!item) return fallback;
                if (typeof item === "string") return item;
                return item[language] || item.en || item.vi || item.ja || fallback;
            },
        [language],
    );

    return (
        <LessonLanguageContext.Provider
            value={{
                language,
                setLanguage,
                showFurigana,
                setShowFurigana,
                getLocalizedText,
            }}
        >
            {children}
        </LessonLanguageContext.Provider>
    );
};

export const useLessonLanguage = (): LessonLanguageContextType => {
    const ctx = useContext(LessonLanguageContext);
    if (!ctx) {
        throw new Error("useLessonLanguage must be used within a LessonLanguageProvider");
    }
    return ctx;
};
