import type { ReactNode } from "react";
import { Clock } from "lucide-react";
import { renderInlineTokens } from "../../util/documentTokenUtils";

export const AVATAR_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
    linh: {
        bg: "border border-purple-200 bg-purple-100 dark:bg-purple-950/80",
        text: "text-purple-700 dark:text-purple-300",
        ring: "ring-purple-200 dark:ring-purple-800",
    },
    mike: {
        bg: "border border-blue-200 bg-blue-100 dark:bg-blue-950/80",
        text: "text-blue-700 dark:text-blue-300",
        ring: "ring-blue-200 dark:ring-blue-800",
    },
    sara: {
        bg: "border border-amber-200 bg-amber-100 dark:bg-amber-950/80",
        text: "text-amber-700 dark:text-amber-300",
        ring: "ring-amber-200 dark:ring-amber-800",
    },
    tom: {
        bg: "border border-emerald-200 bg-emerald-100 dark:bg-emerald-950/80",
        text: "text-emerald-700 dark:text-emerald-300",
        ring: "ring-emerald-200 dark:ring-emerald-800",
    },
    david: {
        bg: "border border-cyan-200 bg-cyan-100 dark:bg-cyan-950/80",
        text: "text-cyan-700 dark:text-cyan-300",
        ring: "ring-cyan-200 dark:ring-cyan-800",
    },
    priya: {
        bg: "border border-rose-200 bg-rose-100 dark:bg-rose-950/80",
        text: "text-rose-700 dark:text-rose-300",
        ring: "ring-rose-200 dark:ring-rose-800",
    },
    alex: {
        bg: "border border-indigo-200 bg-indigo-100 dark:bg-indigo-950/80",
        text: "text-indigo-700 dark:text-indigo-300",
        ring: "ring-indigo-200 dark:ring-indigo-800",
    },
};

export const COLOR_PALETTE = [
    {
        bg: "border border-indigo-200 bg-indigo-100 dark:bg-indigo-950/80",
        text: "text-indigo-700 dark:text-indigo-300",
        ring: "ring-indigo-200 dark:ring-indigo-800",
    },
    {
        bg: "border border-purple-200 bg-purple-100 dark:bg-purple-950/80",
        text: "text-purple-700 dark:text-purple-300",
        ring: "ring-purple-200 dark:ring-purple-800",
    },
    {
        bg: "border border-blue-200 bg-blue-100 dark:bg-blue-950/80",
        text: "text-blue-700 dark:text-blue-300",
        ring: "ring-blue-200 dark:ring-blue-800",
    },
    {
        bg: "border border-emerald-200 bg-emerald-100 dark:bg-emerald-950/80",
        text: "text-emerald-700 dark:text-emerald-300",
        ring: "ring-emerald-200 dark:ring-emerald-800",
    },
    {
        bg: "border border-amber-200 bg-amber-100 dark:bg-amber-950/80",
        text: "text-amber-700 dark:text-amber-300",
        ring: "ring-amber-200 dark:ring-amber-800",
    },
    {
        bg: "border border-rose-200 bg-rose-100 dark:bg-rose-950/80",
        text: "text-rose-700 dark:text-rose-300",
        ring: "ring-rose-200 dark:ring-rose-800",
    },
    {
        bg: "border border-cyan-200 bg-cyan-100 dark:bg-cyan-950/80",
        text: "text-cyan-700 dark:text-cyan-300",
        ring: "ring-cyan-200 dark:ring-cyan-800",
    },
];

export function getSpeakerColor(name: string) {
    const key = name.toLowerCase().replace(/[^a-z]/g, "");
    if (AVATAR_COLORS[key]) return AVATAR_COLORS[key];
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash += key.charCodeAt(i);
    return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

export const CHAT_LINE_REGEX =
    /^(?:\[(\d{1,2}:\d{2}(?:\s*(?:AM|PM|UTC))?)\]\s*)?@?([A-Za-z0-9_.-]+)(?:\s*\(([^)]+)\))?:\s*(.*)$/;

export function parseChatLine(line: string): {
    time: string;
    sender: string;
    role: string;
    msg: string;
} | null {
    const match = line.match(CHAT_LINE_REGEX);
    if (!match) return null;

    let time = match[1] || "";
    let sender = match[2];
    let role = "";
    if (match[3]) {
        if (/\d{1,2}:\d{2}/.test(match[3])) {
            if (!time) time = match[3];
        } else {
            role = match[3].trim();
        }
    }
    const msg = match[4].trim();
    return { time, sender, role, msg };
}

export function renderChatMessage(
    rawSender: string,
    rawRole: string,
    time: string,
    msg: string,
    key: string,
): ReactNode {
    const cleanSender = rawSender.replace(/^@/, "").trim();
    const color = getSpeakerColor(cleanSender);
    const initial = cleanSender.charAt(0).toUpperCase() || "U";

    return (
        <div
            key={key}
            className="group relative my-1.5 flex items-start gap-3 rounded-xl border border-transparent p-2.5 transition-colors hover:border-slate-200/80 hover:bg-slate-50/90 dark:hover:border-slate-800 dark:hover:bg-slate-800/40"
        >
            <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-xs ${color.bg} ${color.text} ring-1 ${color.ring}`}
            >
                {initial}
            </div>
            <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {cleanSender}
                    </span>
                    {rawRole && (
                        <span className="rounded border border-slate-200/90 bg-slate-100/90 px-1.5 py-0.2 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {rawRole}
                        </span>
                    )}
                    {time && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                            <Clock className="h-3 w-3" />
                            {time}
                        </span>
                    )}
                </div>
                <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                    {renderInlineTokens(msg)}
                </div>
            </div>
        </div>
    );
}
