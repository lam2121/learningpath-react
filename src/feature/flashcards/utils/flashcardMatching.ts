import { parseRubyText } from "@/common/component/RubyText";

export function getPaginationItems(current: number, total: number): (number | "...")[] {
    if (total <= 10) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const items: (number | "...")[] = [];

    // Near start
    if (current <= 6) {
        for (let i = 1; i <= Math.min(8, total); i++) {
            items.push(i);
        }
        if (total > 8) {
            items.push("...");
            items.push(total - 1);
            items.push(total);
        }
    }
    // Near end
    else if (current >= total - 5) {
        items.push(1);
        items.push(2);
        items.push("...");
        for (let i = total - 7; i <= total; i++) {
            items.push(i);
        }
    }
    // In middle
    else {
        items.push(1);
        items.push("...");
        for (let i = current - 2; i <= current + 2; i++) {
            items.push(i);
        }
        items.push("...");
        items.push(total);
    }

    return items;
}

export function getStudyModeFromLanguage(lang?: string): "vi" | "ja" | "en" {
    if (!lang) return "en";
    if (lang === "vi") return "vi";
    if (lang === "jp" || lang.startsWith("ja")) return "ja";
    return "en";
}

export function maskTargetWord(text: string, targetWord: string): string {
    if (!text || !targetWord) return text || "";
    const escaped = targetWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    return text.replace(regex, "______");
}

export function checkVietnameseMatch(userGuess: string, expected: string): boolean {
    if (!userGuess || !expected) return false;

    const normalize = (str: string) =>
        str
            .trim()
            .toLowerCase()
            .normalize("NFC")
            .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "")
            .replace(/\s+/g, " ");

    const cleanGuess = normalize(userGuess);
    const cleanExpected = normalize(expected);

    if (!cleanGuess || !cleanExpected) return false;
    if (cleanGuess === cleanExpected) return true;

    // Check alternatives separated by commas, semicolons, slashes, or 'hoặc'
    const alternatives = expected
        .split(/[,;/]+|\s+hoặc\s+/i)
        .map((part) => normalize(part))
        .filter(Boolean);

    return alternatives.includes(cleanGuess);
}

export function checkJapaneseMatch(userGuess: string, expected: string): boolean {
    if (!userGuess || !expected) return false;

    const normalize = (str: string) =>
        str
            .trim()
            .toLowerCase()
            .normalize("NFKC")
            .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'、。・／]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    const cleanGuess = normalize(userGuess);
    if (!cleanGuess) return false;

    const segments = parseRubyText(expected);
    const kanjiStr = segments.map((s) => s.base).join("");
    const readingStr = segments.map((s) => s.reading || s.base).join("");

    const candidates = [expected, kanjiStr, readingStr];

    for (const cand of candidates) {
        const parts = cand.split(/[/;,、|／]+|\s+(?:または|もしくは)\s+/i);
        for (const part of parts) {
            const cleanPart = normalize(part);
            if (!cleanPart) continue;
            if (cleanPart === cleanGuess) return true;

            const noSpaceGuess = cleanGuess.replace(/\s+/g, "");
            const noSpacePart = cleanPart.replace(/\s+/g, "");
            if (noSpaceGuess && noSpacePart && noSpaceGuess === noSpacePart) {
                return true;
            }
        }
    }

    return false;
}

export function checkEnglishMatch(userGuess: string, expected: string): boolean {
    if (!userGuess || !expected) return false;
    const clean = (s: string) =>
        s
            .trim()
            .toLowerCase()
            .replace(/^[a-z]{1,3}\.\s+/, "")
            .replace(/^(a|an|the)\s+/i, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, " ")
            .trim();

    return clean(userGuess) === clean(expected);
}
