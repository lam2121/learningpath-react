import type {
    ParsedQuiz,
    ParsedTheorySection,
    QuizRow,
    TheorySectionKey,
} from "../type/lessonWorkspace";
import { SECTION_META } from "./lessonFormatters";

export function parseMaybeJson(value: unknown): unknown {
    if (typeof value !== "string") {
        return value;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return value;
    }

    if (
        (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
        (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
        try {
            return JSON.parse(trimmed);
        } catch {
            return value;
        }
    }

    return value;
}

export function findQuizObject(value: unknown, depth = 0): Record<string, unknown> | null {
    if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        ("fill_blank" in value || "multi_select" in value || "ordering" in value)
    ) {
        return value as Record<string, unknown>;
    }

    if (value && typeof value === "object" && depth < 3) {
        for (const nested of Object.values(value as Record<string, unknown>)) {
            const found = findQuizObject(nested, depth + 1);
            if (found) {
                return found;
            }
        }
    }

    return null;
}

export function normalizeTheoryContent(value: unknown): ParsedTheorySection[] | null {
    const parsed = parseMaybeJson(value);

    // Support structured C-1 object format (7 section keys)
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const obj = parsed as Record<string, any>;
        const keys: TheorySectionKey[] = [
            "scenario",
            "vocab",
            "phrases",
            "reading",
            "dialogue",
            "listening",
            "wrapup",
        ];
        if (keys.every((k) => k in obj)) {
            const schemaVersion =
                typeof obj.schema_version === "number"
                    ? obj.schema_version
                    : 3;

            const toText = (val: any): string => {
                if (!val) return "";
                if (typeof val === "string") return val;
                if (typeof val === "object") return val.en || val.vi || val.ja || "";
                return String(val);
            };

            const sc = obj.scenario || {};
            const scPrimary = toText(sc.english_text || sc.en).trim();
            const scDecisions = Array.isArray(sc.decisions)
                ? sc.decisions.map((d: any, i: number) => `${i + 1}. ${toText(d)}`).join(" | ")
                : "";
            const scNote = toText(sc.teacher_note);

            const vb = obj.vocab || {};
            const vbItems = Array.isArray(vb.items)
                ? vb.items
                    .map(
                        (item: any) =>
                            `${toText(item.term)}|${item.ipa || ""}|${item.pos || ""}|${toText(item.vn_meaning || item.term?.vi)}|${toText(item.explanation)}|${toText(item.example)}|${toText(item.pronunciation_guide)}`,
                    )
                    .join(" # ")
                : "";
            const vbDrills = Array.isArray(vb.drills)
                ? vb.drills.map((d: any, i: number) => `${i + 1}. ${toText(d)}`).join(" | ")
                : "";
            const vbSecondary = `Pronunciation Guide: ${toText(vb.pronunciation_guide)} | Drills: ${vbDrills}`.trim();
            const vbNote = toText(vb.teacher_note);

            const ph = obj.phrases || {};
            const phItems = Array.isArray(ph.items)
                ? ph.items
                    .map(
                        (item: any) =>
                            `${toText(item.phrase)}|${toText(item.vn_meaning || item.meaning)}|${toText(item.when_to_use)}|${toText(item.example)}`,
                    )
                    .join(" # ")
                : "";
            const phMini = Array.isArray(ph.mini_scenarios)
                ? ph.mini_scenarios
                    .map((s: any, i: number) => `Scenario ${i + 1}: ${toText(s.context)} -> Best phrase: ${toText(s.best_phrase)}`)
                    .join(" | ")
                : "";
            const phNote = toText(ph.teacher_note);

            const rd = obj.reading || {};
            const rdPrimary = rd.document || "";
            const rdQa = Array.isArray(rd.qa)
                ? rd.qa.map((qa: any, i: number) => `Q${i + 1}. ${toText(qa.question)} || A${i + 1}. ${toText(qa.answer)}`).join(" | ")
                : "";
            const rdNote = toText(rd.teacher_note);

            const dl = obj.dialogue || {};
            const dlTurns = Array.isArray(dl.turns)
                ? dl.turns.map((t: any) => `${t.speaker || ""}: ${toText(t.line)}`).join(" | ")
                : "";
            const dlPrimary = `Context: ${toText(dl.context)} || Dialogue: ${dlTurns}`.trim();
            const dlKp = Array.isArray(dl.key_phrases)
                ? dl.key_phrases.map((kp: any) => `${toText(kp.phrase)} - ${toText(kp.why_it_works)}`).join(" | ")
                : "";
            const dlTasks = Array.isArray(dl.practice_tasks)
                ? dl.practice_tasks
                    .map(
                        (t: any, i: number) => {
                            const rawPrompt = toText(t.prompt);
                            const cleanPrompt = rawPrompt
                                .replace(/\s*,?\s*using\s+(?:key_phrases?|phrases?)\s*(?:\[\s*\d+\s*\])?\.?/gi, "")
                                .trim();
                            return `${i + 1}. (${(t.type || "ask").charAt(0).toUpperCase() + (t.type || "ask").slice(1)}): ${cleanPrompt} -> Suggested Answer: ${toText(t.suggested_answer)}`;
                        },
                    )
                    .join(" | ")
                : "";
            const dlSecondary = `${dlKp} || Practice Tasks: ${dlTasks}`.trim();
            const dlNote = toText(dl.teacher_note);

            const ls = obj.listening || {};
            const lsPrimary = `Audio Script: ${ls.speaker || ""}: '${toText(ls.script)}'`.trim();
            const lsQa = Array.isArray(ls.qa)
                ? ls.qa.map((qa: any, i: number) => `Q${i + 1}. ${toText(qa.question)} || A${i + 1}. ${toText(qa.answer)}`).join(" | ")
                : "";
            const lsNote = toText(ls.teacher_note);

            const wp = obj.wrapup || {};
            const wpTakeaways = Array.isArray(wp.takeaways)
                ? wp.takeaways.map((t: any, i: number) => `${i + 1}. ${toText(t)}`).join(" | ")
                : "";
            const wpSecondary = `Action Task: ${toText(wp.action_task)}`.trim();
            const wpNote = toText(wp.teacher_note);

            return [
                { key: "scenario", label: SECTION_META.find((m) => m.key === "scenario")?.label ?? "Scenario", primary: scPrimary, secondary: scDecisions, note: scNote, raw: sc, schemaVersion },
                { key: "vocab", label: SECTION_META.find((m) => m.key === "vocab")?.label ?? "Vocabulary", primary: vbItems, secondary: vbSecondary, note: vbNote, raw: vb, schemaVersion },
                { key: "phrases", label: SECTION_META.find((m) => m.key === "phrases")?.label ?? "Phrases", primary: phItems, secondary: phMini, note: phNote, raw: ph, schemaVersion },
                { key: "reading", label: SECTION_META.find((m) => m.key === "reading")?.label ?? "Reading", primary: typeof rdPrimary === "string" ? rdPrimary : JSON.stringify(rdPrimary), secondary: rdQa, note: rdNote, raw: rd, schemaVersion },
                { key: "dialogue", label: SECTION_META.find((m) => m.key === "dialogue")?.label ?? "Dialogue", primary: dlPrimary, secondary: dlSecondary, note: dlNote, raw: dl, schemaVersion },
                { key: "listening", label: SECTION_META.find((m) => m.key === "listening")?.label ?? "Listening", primary: lsPrimary, secondary: lsQa, note: lsNote, raw: ls, schemaVersion },
                { key: "wrapup", label: SECTION_META.find((m) => m.key === "wrapup")?.label ?? "Wrap-up", primary: wpTakeaways, secondary: wpSecondary, note: wpNote, raw: wp, schemaVersion },
            ];
        }
    }

    return null;
}

export function normalizeQuizContent(value: unknown): ParsedQuiz | null {
    const parsed = parseMaybeJson(value);
    const raw = findQuizObject(parsed);
    if (!raw) {
        return null;
    }
    const fillBlank = Array.isArray(raw.fill_blank) ? raw.fill_blank : null;
    const multiSelect = Array.isArray(raw.multi_select) ? raw.multi_select : null;
    const ordering = Array.isArray(raw.ordering) ? raw.ordering : null;

    if (!fillBlank || !multiSelect || !ordering) {
        return null;
    }

    const toRows = (rows: unknown[]): QuizRow[] =>
        rows.filter(
            (row): row is QuizRow =>
                Array.isArray(row) &&
                row.length >= 4 &&
                typeof row[0] === "string" &&
                typeof row[1] === "string" &&
                typeof row[2] === "string" &&
                typeof row[3] === "string",
        );

    return {
        fillBlank: toRows(fillBlank),
        multiSelect: toRows(multiSelect),
        ordering: toRows(ordering),
    };
}
