import {
    AlertCircle,
    BookOpen,
    ClipboardList,
    FileEdit,
    FileText,
    ListChecks,
    Mail,
    MessageSquareText,
    TrendingUp,
    CheckCircle2,
    ShieldCheck,
    Bookmark,
    Layers,
    Activity,
    Calendar,
    AlertTriangle,
    Tag,
    CheckSquare,
} from "lucide-react";
import type { DocCategory, DocTheme, MetaItem } from "../../type/technicalDocument";

export function detectDocCategory(firstLines: string[]): DocTheme {
    const textSample = firstLines.slice(0, 8).join(" ").toLowerCase();

    // 1. Slack / Teams Discussion
    if (
        textSample.includes("slack") ||
        textSample.includes("teams") ||
        textSample.includes("channel:") ||
        /#[a-zA-Z0-9_\-\u2011]+/i.test(textSample) ||
        textSample.includes("discussion thread")
    ) {
        return {
            category: "slack",
            badgeLabel: "Team Discussion Thread",
            badgeColor:
                "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300",
            containerBorder: "border-t-4 border-t-teal-500",
            headerBg: "bg-teal-50/20 dark:bg-teal-950/10",
            icon: MessageSquareText,
            primaryColor: "teal",
        };
    }

    // 2. Incident Post-Mortem (RCA)
    if (
        textSample.includes("incident") ||
        textSample.includes("post-mortem") ||
        textSample.includes("post‑mortem") ||
        textSample.includes("rca") ||
        textSample.includes("root cause")
    ) {
        return {
            category: "incident",
            badgeLabel: "Incident Post-Mortem (RCA)",
            badgeColor:
                "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300",
            containerBorder: "border-t-4 border-t-rose-500",
            headerBg: "bg-rose-50/40 dark:bg-rose-950/20",
            icon: AlertCircle,
            primaryColor: "rose",
        };
    }

    // 3. Email / Client Memo
    if (
        textSample.includes("email") ||
        textSample.includes("mail") ||
        textSample.includes("memo") ||
        textSample.includes("subject:") ||
        textSample.includes("from:") ||
        textSample.includes("to:")
    ) {
        return {
            category: "email",
            badgeLabel: "Workplace Email Memo",
            badgeColor:
                "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
            containerBorder: "border-t-4 border-t-sky-500",
            headerBg: "bg-sky-50/30 dark:bg-sky-950/10",
            icon: Mail,
            primaryColor: "sky",
        };
    }

    // 4. Architecture Decision Record (ADR)
    if (
        textSample.includes("adr") ||
        textSample.includes("architecture decision") ||
        textSample.includes("design spec")
    ) {
        return {
            category: "adr",
            badgeLabel: "Architecture Decision Record (ADR)",
            badgeColor:
                "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300",
            containerBorder: "border-t-4 border-t-indigo-600",
            headerBg: "bg-indigo-50/30 dark:bg-indigo-950/10",
            icon: BookOpen,
            primaryColor: "indigo",
        };
    }

    // 5. Jira User Story
    if (
        textSample.includes("jira") ||
        textSample.includes("user story") ||
        textSample.includes("acceptance criteria") ||
        textSample.includes("ticket") ||
        textSample.includes("scrum")
    ) {
        return {
            category: "jira",
            badgeLabel: "Jira User Story & Acceptance Criteria",
            badgeColor:
                "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300",
            containerBorder: "border-t-4 border-t-blue-600",
            headerBg: "bg-blue-50/30 dark:bg-blue-950/10",
            icon: ListChecks,
            primaryColor: "blue",
        };
    }

    // 6. Meeting Minutes
    if (
        textSample.includes("meeting") ||
        textSample.includes("minutes") ||
        textSample.includes("action items")
    ) {
        return {
            category: "meeting",
            badgeLabel: "Meeting Minutes & Action Items",
            badgeColor:
                "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
            containerBorder: "border-t-4 border-t-amber-500",
            headerBg: "bg-amber-50/30 dark:bg-amber-950/10",
            icon: ClipboardList,
            primaryColor: "amber",
        };
    }

    // 7. Scope Change Request
    if (
        textSample.includes("change request") ||
        textSample.includes("cr-") ||
        textSample.includes("scope change") ||
        textSample.includes("scope-change")
    ) {
        return {
            category: "change_request",
            badgeLabel: "Scope Change Request (CR)",
            badgeColor:
                "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300",
            containerBorder: "border-t-4 border-t-orange-500",
            headerBg: "bg-orange-50/30 dark:bg-orange-950/10",
            icon: FileEdit,
            primaryColor: "orange",
        };
    }

    // 8. Executive Status Report
    if (
        textSample.includes("status report") ||
        textSample.includes("executive") ||
        textSample.includes("progress report") ||
        textSample.includes("sign-off")
    ) {
        return {
            category: "status_report",
            badgeLabel: "Executive Status Report",
            badgeColor:
                "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-300",
            containerBorder: "border-t-4 border-t-cyan-500",
            headerBg: "bg-cyan-50/30 dark:bg-cyan-950/10",
            icon: TrendingUp,
            primaryColor: "cyan",
        };
    }

    return {
        category: "general",
        badgeLabel: "Workplace Technical Document",
        badgeColor:
            "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300",
        containerBorder: "border-t-4 border-t-slate-400",
        headerBg: "bg-slate-50/50 dark:bg-slate-800/20",
        icon: FileText,
        primaryColor: "slate",
    };
}

export const KNOWN_SECTION_HEADINGS = new Set([
    "incident summary",
    "root cause",
    "corrective actions",
    "preventive measures",
    "context",
    "decision",
    "consequences",
    "trade-offs",
    "user story",
    "acceptance criteria",
    "discussion points",
    "key decisions",
    "action items",
    "proposed change",
    "business justification",
    "impact analysis",
    "milestones",
    "executive summary",
    "risks & mitigations",
    "next steps",
    "overview",
    "message",
    "body",
]);

export function getSectionIconAndColor(category: DocCategory, rawHeading: string) {
    const h = rawHeading.toLowerCase();

    if (category === "incident") {
        if (h.includes("summary") || h.includes("overview")) {
            return {
                icon: AlertCircle,
                colorClass: "text-rose-600 dark:text-rose-400",
                borderClass: "border-rose-200 dark:border-rose-900/60",
            };
        }
        if (h.includes("root cause")) {
            return {
                icon: AlertTriangle,
                colorClass: "text-amber-600 dark:text-amber-400",
                borderClass: "border-amber-200 dark:border-amber-900/60",
            };
        }
        if (
            h.includes("corrective") ||
            h.includes("preventive") ||
            h.includes("action")
        ) {
            return {
                icon: ShieldCheck,
                colorClass: "text-emerald-600 dark:text-emerald-400",
                borderClass: "border-emerald-200 dark:border-emerald-900/60",
            };
        }
    }

    if (category === "meeting") {
        if (h.includes("decision")) {
            return {
                icon: CheckCircle2,
                colorClass: "text-indigo-600 dark:text-indigo-400",
                borderClass: "border-indigo-200 dark:border-indigo-900/60",
            };
        }
        if (h.includes("action item")) {
            return {
                icon: CheckSquare,
                colorClass: "text-amber-600 dark:text-amber-400",
                borderClass: "border-amber-200 dark:border-amber-900/60",
            };
        }
        if (h.includes("discussion") || h.includes("agenda")) {
            return {
                icon: MessageSquareText,
                colorClass: "text-slate-600 dark:text-slate-400",
                borderClass: "border-slate-200 dark:border-slate-800",
            };
        }
    }

    if (category === "jira") {
        if (h.includes("user story")) {
            return {
                icon: Bookmark,
                colorClass: "text-blue-600 dark:text-blue-400",
                borderClass: "border-blue-200 dark:border-blue-900/60",
            };
        }
        if (h.includes("acceptance criteria") || h.includes("scenario")) {
            return {
                icon: ListChecks,
                colorClass: "text-indigo-600 dark:text-indigo-400",
                borderClass: "border-indigo-200 dark:border-indigo-900/60",
            };
        }
    }

    if (category === "adr") {
        if (h.includes("decision")) {
            return {
                icon: CheckCircle2,
                colorClass: "text-indigo-600 dark:text-indigo-400",
                borderClass: "border-indigo-200 dark:border-indigo-900/60",
            };
        }
        if (h.includes("context")) {
            return {
                icon: BookOpen,
                colorClass: "text-slate-600 dark:text-slate-400",
                borderClass: "border-slate-200 dark:border-slate-800",
            };
        }
        if (h.includes("consequences") || h.includes("trade-offs")) {
            return {
                icon: Layers,
                colorClass: "text-violet-600 dark:text-violet-400",
                borderClass: "border-violet-200 dark:border-violet-900/60",
            };
        }
    }

    if (category === "change_request") {
        if (h.includes("proposed change") || h.includes("change")) {
            return {
                icon: FileEdit,
                colorClass: "text-orange-600 dark:text-orange-400",
                borderClass: "border-orange-200 dark:border-orange-900/60",
            };
        }
        if (h.includes("impact")) {
            return {
                icon: Activity,
                colorClass: "text-red-600 dark:text-red-400",
                borderClass: "border-red-200 dark:border-red-900/60",
            };
        }
    }

    if (category === "status_report") {
        if (h.includes("summary")) {
            return {
                icon: TrendingUp,
                colorClass: "text-cyan-600 dark:text-cyan-400",
                borderClass: "border-cyan-200 dark:border-cyan-900/60",
            };
        }
        if (h.includes("milestone")) {
            return {
                icon: Calendar,
                colorClass: "text-emerald-600 dark:text-emerald-400",
                borderClass: "border-emerald-200 dark:border-emerald-900/60",
            };
        }
        if (h.includes("risk") || h.includes("mitigation")) {
            return {
                icon: AlertTriangle,
                colorClass: "text-amber-600 dark:text-amber-400",
                borderClass: "border-amber-200 dark:border-amber-900/60",
            };
        }
    }

    if (category === "email") {
        return {
            icon: Mail,
            colorClass: "text-sky-600 dark:text-sky-400",
            borderClass: "border-sky-200 dark:border-sky-900/60",
        };
    }

    return {
        icon: Tag,
        colorClass: "text-blue-600 dark:text-blue-400",
        borderClass: "border-slate-100 dark:border-slate-800/80",
    };
}

export function isKnownSectionHeading(raw: string): boolean {
    const clean = raw.replace(/^\*{0,2}|\*{0,2}:?$/g, "").trim().toLowerCase();
    const stripped = clean.replace(/\s*\([^)]*\):?$/, "").trim();
    return KNOWN_SECTION_HEADINGS.has(stripped);
}

export function preprocessDocumentLines(lines: string[]): string[] {
    const merged: string[] = [];
    let i = 0;
    while (i < lines.length) {
        let line = lines[i];

        // Clean trailing prompt artifacts or parenthesized guidance on known headings like "Root Cause (1. 2. 3.):" or "Action Items (Owner & Deadline):"
        const candidateHeading = line.replace(/\s*\([^)]*\):?$/, "").trim();
        if (isKnownSectionHeading(candidateHeading)) {
            line = `${candidateHeading}:`;
        }

        // If line is a section heading, NEVER merge it with the next line!
        if (isKnownSectionHeading(line)) {
            merged.push(line.endsWith(":") ? line : `${line}:`);
            i++;
            continue;
        }

        // If line is "Owner & Status:" alone, skip it so following lines become footer meta
        if (/^Owner\s*&\s*Status\s*:?$/i.test(line)) {
            i++;
            continue;
        }

        // If line is `# channel-name` (Slack channel indicator)
        const channelMatch = line.match(/^#\s*([a-zA-Z0-9_\-\u2011]+)$/);
        if (channelMatch) {
            merged.push(`Channel: ${channelMatch[1]}`);
            i++;
            continue;
        }

        // If line is just a lone key without value, e.g. "Incident:" or "Severity:"
        if (/^[A-Za-z0-9_.\-\s/&]+:\s*$/.test(line) && i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            if (
                !isKnownSectionHeading(nextLine) &&
                !/^[A-Za-z0-9_.\-\s/&]+:\s*$/.test(nextLine) &&
                !nextLine.startsWith("#") &&
                nextLine !== "---" &&
                nextLine !== "===" &&
                nextLine.length > 0 &&
                nextLine.length < 150
            ) {
                merged.push(`${line.replace(/:\s*$/, "")}: ${nextLine}`);
                i += 2;
                continue;
            }
        }

        // If line is a lone number, e.g. "1", "2", "3" and next line is text:
        if (/^\d+$/.test(line) && i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            if (
                nextLine &&
                !/^\d+$/.test(nextLine) &&
                !nextLine.startsWith("#") &&
                nextLine !== "---"
            ) {
                merged.push(`${line}. ${nextLine}`);
                i += 2;
                continue;
            }
        }

        merged.push(line);
        i++;
    }
    return merged;
}

export function pullMeta(
    meta: MetaItem[],
    keyPattern: RegExp,
): { found: MetaItem | null; remaining: MetaItem[] } {
    const idx = meta.findIndex((m) => keyPattern.test(m.key.trim()));
    if (idx >= 0) {
        return {
            found: meta[idx],
            remaining: meta.filter((_, i) => i !== idx),
        };
    }
    return { found: null, remaining: meta };
}
