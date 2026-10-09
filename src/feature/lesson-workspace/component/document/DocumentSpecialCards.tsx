import type { ReactNode } from "react";
import { CheckSquare, Calendar, AlertCircle } from "lucide-react";
import { renderInlineTokens } from "../../util/documentTokenUtils";
import { getSpeakerColor } from "./DocumentChatMessage";

/**
 * Parses attendees string into attractive avatar chips.
 * e.g. "Linh (BA), Minh (Product Owner), David (Tech Lead)"
 */
export function renderAttendeesChips(raw: string): ReactNode {
    if (!raw) return null;
    const parts = raw
        .split(/,\s*(?![^()]*\))/g)
        .map((p) => p.trim())
        .filter(Boolean);

    if (parts.length === 0) return <span>{raw}</span>;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {parts.map((p, idx) => {
                const match = p.match(/^(.+?)\s*\(([^)]+)\)$/);
                const name = match ? match[1].trim() : p;
                const role = match ? match[2].trim() : "";
                const color = getSpeakerColor(name);
                const initial = name.charAt(0).toUpperCase() || "U";

                return (
                    <span
                        key={`att-${idx}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                        <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${color.bg} ${color.text}`}
                        >
                            {initial}
                        </span>
                        <span className="font-semibold">{name}</span>
                        {role && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                {role}
                            </span>
                        )}
                    </span>
                );
            })}
        </div>
    );
}

/**
 * Action Item task card with checkbox, assignee chip, and deadline badge.
 */
export function renderActionItemCard(raw: string, index: number): ReactNode {
    const clean = raw.replace(/^[-*•\d+.\)]\s*/, "").trim();
    const match = clean.match(
        /^(?:\[([^\]]+)\]|([A-Za-z0-9_.\s]+?))(?:\s*\(([^)]+)\))?:\s*(.+)$/,
    );

    let owner = "";
    let role = "";
    let task = clean;
    let deadline = "";

    if (match) {
        owner = (match[1] || match[2] || "").trim();
        role = (match[3] || "").trim();
        task = (match[4] || "").trim();

        const dlMatch = task.match(
            /(?:[-–—]\s*(?:Due|Deadline|by):?\s*|\((?:Due|Deadline|by):?\s*|(?:\s+by\s+))([A-Za-z0-9_.\s]+(?:\)|$))/i,
        );
        if (dlMatch) {
            deadline = dlMatch[1].replace(/\)$/, "").trim();
            task = task.slice(0, task.indexOf(dlMatch[0])).trim();
        }
    }

    const color = owner ? getSpeakerColor(owner) : null;
    const initial = owner ? owner.charAt(0).toUpperCase() : null;

    return (
        <div
            key={`action-${index}`}
            className="group my-2 flex flex-col gap-2 rounded-xl border border-amber-200/80 bg-amber-50/40 p-3 transition-all hover:border-amber-300 hover:bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/20 dark:hover:border-amber-800 dark:hover:bg-amber-950/40 sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="flex items-start gap-2.5">
                <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-100">
                    {renderInlineTokens(task)}
                </div>
            </div>
            {(owner || deadline) && (
                <div className="flex flex-wrap items-center gap-2 pl-6 sm:pl-0 sm:shrink-0">
                    {owner && color && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <span
                                className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${color.bg} ${color.text}`}
                            >
                                {initial}
                            </span>
                            <span>{owner}</span>
                            {role && (
                                <span className="text-[10px] text-slate-400">({role})</span>
                            )}
                        </span>
                    )}
                    {deadline && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/80 bg-amber-100/80 px-2 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                            <Calendar className="h-3 w-3" />
                            {deadline}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * 3-Part Agile User Story Card (As a ... I want ... So that ...)
 */
export function renderUserStoryCard(content: string, lang?: "en" | "ja" | "vi"): ReactNode {
    const match = content.match(
        /As an?\s+(.+?)(?:,|\s+)I want\s+(.+?)(?:,|\s+)So that\s+(.+)/i,
    );
    if (!match) {
        return (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
                <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                    {renderInlineTokens(content)}
                </p>
            </div>
        );
    }

    const role = match[1].trim();
    const want = match[2].trim();
    const benefit = match[3].trim();

    return (
        <div className="my-3 space-y-2 rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 p-4 shadow-xs dark:border-blue-900/60 dark:from-blue-950/40 dark:to-indigo-950/20">
            <div className="flex items-start gap-2.5">
                <span className="rounded-md border border-blue-300 bg-blue-100 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-blue-800 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {lang === "ja" ? "役割" : lang === "vi" ? "Với vai trò" : "As a"}
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {role}
                </span>
            </div>
            <div className="flex items-start gap-2.5">
                <span className="rounded-md border border-indigo-300 bg-indigo-100 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-indigo-800 dark:border-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                    {lang === "ja" ? "要望" : lang === "vi" ? "Tôi muốn" : "I want"}
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {want}
                </span>
            </div>
            <div className="flex items-start gap-2.5">
                <span className="rounded-md border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    {lang === "ja" ? "目的" : lang === "vi" ? "Để có thể" : "So that"}
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {benefit}
                </span>
            </div>
        </div>
    );
}

/**
 * Contrast Trade-Off Item (+ Benefit vs - Trade-off)
 */
export function renderTradeOffItem(line: string, index: number, lang?: "en" | "ja" | "vi"): ReactNode {
    const isPositive =
        line.startsWith("+") ||
        /^\[\+\]/i.test(line) ||
        /^(?:pro|benefit|positive|advantage):/i.test(line);
    const isNegative =
        line.startsWith("-") ||
        /^\[\-\]/i.test(line) ||
        /^(?:con|trade-off|tradeoff|drawback|negative|disadvantage):/i.test(line);

    const cleanText = line
        .replace(
            /^(\+|\-|\[\+\]|\[\-\]|pro:|benefit:|con:|trade-off:|drawback:)\s*/i,
            "",
        )
        .trim();

    if (isPositive) {
        return (
            <div
                key={`to-${index}`}
                className="my-2 flex items-start gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20"
            >
                <span className="mt-0.5 inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200">
                    {lang === "ja" ? "+ メリット" : lang === "vi" ? "+ Lợi ích" : "+ Benefit"}
                </span>
                <div className="min-w-0 flex-1 text-sm text-slate-800 dark:text-slate-200">
                    {renderInlineTokens(cleanText)}
                </div>
            </div>
        );
    }

    if (isNegative) {
        return (
            <div
                key={`to-${index}`}
                className="my-2 flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/60 dark:bg-amber-950/20"
            >
                <span className="mt-0.5 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/80 dark:text-amber-200">
                    {lang === "ja" ? "- トレードオフ" : lang === "vi" ? "- Đánh đổi" : "- Trade-off"}
                </span>
                <div className="min-w-0 flex-1 text-sm text-slate-800 dark:text-slate-200">
                    {renderInlineTokens(cleanText)}
                </div>
            </div>
        );
    }

    return (
        <div
            key={`to-${index}`}
            className="my-2 flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200"
        >
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            <div className="min-w-0 flex-1">{renderInlineTokens(cleanText)}</div>
        </div>
    );
}

/**
 * Incident Summary alert callout box.
 */
export function renderIncidentSummary(content: string, lang?: "en" | "ja" | "vi"): ReactNode {
    return (
        <div className="my-3 rounded-r-xl border-l-4 border-rose-500 bg-rose-50/70 p-4 dark:border-rose-600 dark:bg-rose-950/30">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5" />{" "}
                {lang === "ja" ? "インシデント概要" : lang === "vi" ? "Tổng quan sự cố" : "Incident Overview"}
            </div>
            <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                {renderInlineTokens(content)}
            </p>
        </div>
    );
}

/**
 * Email body paragraph with automatic email sign-off formatting.
 */
export function renderEmailBodyParagraph(text: string, index: number): ReactNode {
    const signOffRegex =
        /^(?:(Best\s+regards|Warm\s+regards|Kind\s+regards|Regards|Sincerely|Thanks\s*(?:&|and)?\s*regards|Thanks|Cheers),?\s*\n+)(.*)$/is;
    const match = text.match(signOffRegex);
    if (match) {
        const signOffWord = match[1].trim();
        const signOffRest = match[2].trim();
        return (
            <div
                key={`p-${index}`}
                className="my-4 border-t border-slate-200/80 pt-3 dark:border-slate-800"
            >
                <p className="text-sm italic text-slate-600 dark:text-slate-400">
                    {signOffWord},
                </p>
                <div className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                    {signOffRest.split(/\n+/).map((l, lIdx) => (
                        <div key={`so-${lIdx}`}>{l.trim()}</div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <p
            key={`p-${index}`}
            className="my-3 text-sm leading-7 text-slate-700 dark:text-slate-200"
        >
            {renderInlineTokens(text)}
        </p>
    );
}
