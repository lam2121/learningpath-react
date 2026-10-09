import { type ReactNode } from "react";
import { CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import type {
    StructuredDocument,
    MetaItem,
    ChatMessageItem,
    DocTheme,
} from "../../type/technicalDocument";
import { renderInlineTokens } from "../../util/documentTokenUtils";
import {
    detectDocCategory,
    getSectionIconAndColor,
    preprocessDocumentLines,
} from "./documentViewerTheme";
import {
    renderChatMessage,
    parseChatLine,
} from "./DocumentChatMessage";
import {
    renderActionItemCard,
    renderUserStoryCard,
    renderTradeOffItem,
    renderIncidentSummary,
    renderEmailBodyParagraph,
} from "./DocumentSpecialCards";

export interface ParsedDocumentResult {
    isInvalid?: boolean;
    title: string;
    metaHeader: MetaItem[];
    metaFooter: MetaItem[];
    bodyElements: ReactNode[];
    docInfo: DocTheme;
}

export function parseDocumentContent(
    text: any,
    schemaVersion?: number,
    effectiveLang: "en" | "ja" | "vi" = "en",
): ParsedDocumentResult {
    if (!text) {
        return {
            title: "",
            metaHeader: [] as MetaItem[],
            metaFooter: [] as MetaItem[],
            bodyElements: [] as ReactNode[],
            docInfo: detectDocCategory([]),
        };
    }

    // Check if input is a structured JSON document (Universal Document Schema)
    let structuredDoc: StructuredDocument | null = null;
    if (typeof text === "object" && text !== null) {
        structuredDoc = text as StructuredDocument;
    } else if (typeof text === "string") {
        const trimmed = text.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            try {
                const parsedObj = JSON.parse(trimmed);
                if (
                    parsedObj &&
                    typeof parsedObj === "object" &&
                    (Array.isArray(parsedObj.sections) ||
                        parsedObj.doc_type ||
                        parsedObj.title)
                ) {
                    structuredDoc = parsedObj as StructuredDocument;
                }
            } catch {
                // Fallback to legacy text parser below
            }
        }
    }

    const isV2 =
        Boolean(
            structuredDoc &&
            Array.isArray(structuredDoc.sections) &&
            structuredDoc.sections.length > 0,
        ) ||
        (typeof schemaVersion === "number" && schemaVersion >= 2) ||
        (typeof text === "object" &&
            text !== null &&
            ((text as any).schema_version >= 2 || (text as any).sections));

    if (isV2) {
        // Strict v2 runtime guards: validate every section according to discriminated union
        const isValidV2Doc =
            Boolean(structuredDoc) &&
            Array.isArray(structuredDoc?.sections) &&
            structuredDoc!.sections.length > 0 &&
            structuredDoc!.sections.every((sec) => {
                if (
                    !sec ||
                    typeof sec !== "object" ||
                    typeof sec.heading !== "string" ||
                    !sec.heading.trim()
                ) {
                    return false;
                }

                switch (sec.type) {
                    case "paragraph":
                        return (
                            typeof sec.content === "string" &&
                            sec.content.trim().length > 0 &&
                            (!("items" in sec) || sec.items === undefined || sec.items === null)
                        );
                    case "bullet":
                    case "numbered":
                        return (
                            Array.isArray(sec.items) &&
                            sec.items.length > 0 &&
                            sec.items.every(
                                (it) => typeof it === "string" && it.trim().length > 0,
                            ) &&
                            (!("content" in sec) ||
                                sec.content === undefined ||
                                sec.content === null ||
                                sec.content === "")
                        );
                    case "chat":
                        return (
                            Array.isArray(sec.items) &&
                            sec.items.length > 0 &&
                            sec.items.every(
                                (it) =>
                                    it &&
                                    typeof it === "object" &&
                                    typeof (it as any).sender === "string" &&
                                    (it as any).sender.trim().length > 0 &&
                                    typeof (it as any).text === "string" &&
                                    (it as any).text.trim().length > 0,
                            ) &&
                            (!("content" in sec) ||
                                sec.content === undefined ||
                                sec.content === null ||
                                sec.content === "")
                        );
                    default:
                        return false;
                }
            });

        if (!isValidV2Doc) {
            return {
                isInvalid: true,
                title: "",
                metaHeader: [] as MetaItem[],
                metaFooter: [] as MetaItem[],
                bodyElements: [] as ReactNode[],
                docInfo: detectDocCategory([]),
            };
        }
    }

    if (structuredDoc) {
        const docInfo = detectDocCategory([
            structuredDoc.doc_type || "",
            structuredDoc.title || "",
        ]);

        const metaHeader: MetaItem[] = Array.isArray(structuredDoc.metadata)
            ? structuredDoc.metadata.filter((m) => m && m.key && m.value)
            : [];

        const bodyElements: ReactNode[] = [];
        const sections = Array.isArray(structuredDoc.sections)
            ? structuredDoc.sections
            : [];

        sections.forEach((sec, sIdx) => {
            if (!sec) return;
            const headingLower = (sec.heading || "").toLowerCase();

            // Section Heading
            if (sec.heading) {
                const {
                    icon: SecIcon,
                    colorClass,
                    borderClass,
                } = getSectionIconAndColor(docInfo.category, sec.heading);

                bodyElements.push(
                    <h4
                        key={`sec-hd-${sIdx}`}
                        className={`mb-2.5 mt-5 flex items-center gap-2 border-b ${borderClass} pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 dark:border-slate-800/80 dark:text-white`}
                    >
                        <SecIcon className={`h-3.5 w-3.5 ${colorClass}`} />
                        {sec.heading}
                    </h4>,
                );
            }

            if (isV2) {
                // Strict switch by sec.type for Schema v2: zero heuristics, pure discriminated union
                switch (sec.type) {
                    case "paragraph":
                        if (
                            docInfo.category === "incident" &&
                            (headingLower.includes("summary") ||
                                headingLower.includes("overview"))
                        ) {
                            bodyElements.push(
                                <div key={`sec-inc-sum-${sIdx}`}>
                                    {renderIncidentSummary(sec.content!, effectiveLang)}
                                </div>,
                            );
                        } else if (
                            docInfo.category === "jira" &&
                            (headingLower.includes("user story") ||
                                /as an?\s+/i.test(sec.content!))
                        ) {
                            bodyElements.push(
                                <div key={`sec-story-${sIdx}`}>
                                    {renderUserStoryCard(sec.content!, effectiveLang)}
                                </div>,
                            );
                        } else if (
                            docInfo.category === "adr" &&
                            headingLower.includes("decision")
                        ) {
                            bodyElements.push(
                                <div
                                    key={`sec-adr-dec-${sIdx}`}
                                    className="my-3 rounded-r-xl border-l-4 border-indigo-600 bg-indigo-50/70 p-4 dark:border-indigo-500 dark:bg-indigo-950/30"
                                >
                                    <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                                        <CheckCircle2 className="h-3.5 w-3.5" />{" "}
                                        {effectiveLang === "ja"
                                            ? "アーキテクチャ決定"
                                            : effectiveLang === "vi"
                                              ? "Quyết định kiến trúc"
                                              : "Architectural Decision"}
                                    </div>
                                    <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                                        {renderInlineTokens(sec.content!)}
                                    </p>
                                </div>,
                            );
                        } else if (docInfo.category === "email") {
                            bodyElements.push(
                                <div key={`sec-email-body-${sIdx}`}>
                                    {renderEmailBodyParagraph(sec.content!, sIdx)}
                                </div>,
                            );
                        } else {
                            bodyElements.push(
                                <p
                                    key={`sec-p-${sIdx}`}
                                    className="my-2.5 text-sm leading-7 text-slate-700 dark:text-slate-200"
                                >
                                    {renderInlineTokens(sec.content!)}
                                </p>,
                            );
                        }
                        break;

                    case "numbered":
                        (sec.items as string[]).forEach((item, itemIdx) => {
                            const cleanText = item.replace(/^\d+[\.\)]\s*/, "");
                            bodyElements.push(
                                <div
                                    key={`sec-num-${sIdx}-${itemIdx}`}
                                    className="my-2.5 flex items-start gap-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200"
                                >
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                        {itemIdx + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        {renderInlineTokens(cleanText)}
                                    </div>
                                </div>,
                            );
                        });
                        break;

                    case "bullet":
                        if (
                            docInfo.category === "meeting" &&
                            headingLower.includes("action item")
                        ) {
                            (sec.items as string[]).forEach((item, itemIdx) => {
                                bodyElements.push(renderActionItemCard(item, itemIdx));
                            });
                        } else {
                            (sec.items as string[]).forEach((item, itemIdx) => {
                                const cleanText = item.replace(/^[-*•]\s*/, "");
                                bodyElements.push(
                                    <div
                                        key={`sec-blt-${sIdx}-${itemIdx}`}
                                        className="my-2 flex items-start gap-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200"
                                    >
                                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                                        <div className="min-w-0 flex-1">
                                            {renderInlineTokens(cleanText)}
                                        </div>
                                    </div>,
                                );
                            });
                        }
                        break;

                    case "chat":
                        (sec.items as ChatMessageItem[]).forEach((item, itemIdx) => {
                            bodyElements.push(
                                renderChatMessage(
                                    item.sender,
                                    item.role || "",
                                    item.time || "",
                                    item.text,
                                    `sec-chat-${sIdx}-${itemIdx}`,
                                ),
                            );
                        });
                        break;
                }
                return;
            }

            // Legacy Fallback Content Rendering (non-v2)

            // Paragraph Content
            if (sec.content) {
                if (
                    docInfo.category === "incident" &&
                    (headingLower.includes("summary") ||
                        headingLower.includes("overview"))
                ) {
                    bodyElements.push(
                        <div key={`sec-inc-sum-${sIdx}`}>
                            {renderIncidentSummary(sec.content, effectiveLang)}
                        </div>,
                    );
                } else if (
                    docInfo.category === "jira" &&
                    (headingLower.includes("user story") ||
                        /as an?\s+/i.test(sec.content))
                ) {
                    bodyElements.push(
                        <div key={`sec-story-${sIdx}`}>
                            {renderUserStoryCard(sec.content, effectiveLang)}
                        </div>,
                    );
                } else if (
                    docInfo.category === "adr" &&
                    headingLower.includes("decision")
                ) {
                    bodyElements.push(
                        <div
                            key={`sec-adr-dec-${sIdx}`}
                            className="my-3 rounded-r-xl border-l-4 border-indigo-600 bg-indigo-50/70 p-4 dark:border-indigo-500 dark:bg-indigo-950/30"
                        >
                            <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                                <CheckCircle2 className="h-3.5 w-3.5" />{" "}
                                {effectiveLang === "ja"
                                    ? "アーキテクチャ決定"
                                    : effectiveLang === "vi"
                                      ? "Quyết định kiến trúc"
                                      : "Architectural Decision"}
                            </div>
                            <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                                {renderInlineTokens(sec.content)}
                            </p>
                        </div>,
                    );
                } else if (docInfo.category === "email") {
                    bodyElements.push(
                        <div key={`sec-email-body-${sIdx}`}>
                            {renderEmailBodyParagraph(sec.content, sIdx)}
                        </div>,
                    );
                } else {
                    bodyElements.push(
                        <p
                            key={`sec-p-${sIdx}`}
                            className="my-2.5 text-sm leading-7 text-slate-700 dark:text-slate-200"
                        >
                            {renderInlineTokens(sec.content)}
                        </p>,
                    );
                }
            }

            // List / Chat Items
            if (Array.isArray(sec.items)) {
                const secType = (sec.type || "bullet").toLowerCase();

                if (
                    docInfo.category === "meeting" &&
                    headingLower.includes("action item")
                ) {
                    sec.items.forEach((item, itemIdx) => {
                        const itemText =
                            typeof item === "string"
                                ? item
                                : (item as any)?.text || JSON.stringify(item);
                        bodyElements.push(renderActionItemCard(itemText, itemIdx));
                    });
                } else if (
                    docInfo.category === "meeting" &&
                    headingLower.includes("decision")
                ) {
                    sec.items.forEach((item, itemIdx) => {
                        const itemText =
                            typeof item === "string"
                                ? item
                                : (item as any)?.text || JSON.stringify(item);
                        const cleanText = itemText.replace(/^[-*•\d+.\)]\s*/, "");
                        bodyElements.push(
                            <div
                                key={`sec-dec-${sIdx}-${itemIdx}`}
                                className="my-2 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/30"
                            >
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                                <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                    {renderInlineTokens(cleanText)}
                                </div>
                            </div>,
                        );
                    });
                } else if (
                    docInfo.category === "adr" &&
                    (headingLower.includes("trade-off") ||
                        headingLower.includes("consequences"))
                ) {
                    sec.items.forEach((item, itemIdx) => {
                        const itemText =
                            typeof item === "string"
                                ? item
                                : (item as any)?.text || JSON.stringify(item);
                        bodyElements.push(renderTradeOffItem(itemText, itemIdx));
                    });
                } else if (
                    docInfo.category === "incident" &&
                    headingLower.includes("root cause")
                ) {
                    sec.items.forEach((item, itemIdx) => {
                        const itemText =
                            typeof item === "string"
                                ? item
                                : (item as any)?.text || JSON.stringify(item);
                        const cleanText = itemText.replace(/^[-*•\d+.\)]\s*/, "");
                        bodyElements.push(
                            <div
                                key={`sec-rc-${sIdx}-${itemIdx}`}
                                className="my-2 flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/60 dark:bg-amber-950/20"
                            >
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                                    {itemIdx + 1}
                                </span>
                                <div className="min-w-0 flex-1 text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-100">
                                    {renderInlineTokens(cleanText)}
                                </div>
                            </div>,
                        );
                    });
                } else if (
                    docInfo.category === "incident" &&
                    (headingLower.includes("corrective") ||
                        headingLower.includes("preventive"))
                ) {
                    sec.items.forEach((item, itemIdx) => {
                        const itemText =
                            typeof item === "string"
                                ? item
                                : (item as any)?.text || JSON.stringify(item);
                        const cleanText = itemText.replace(/^[-*•\d+.\)]\s*/, "");
                        bodyElements.push(
                            <div
                                key={`sec-cor-${sIdx}-${itemIdx}`}
                                className="my-2 flex items-start gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                            >
                                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <div className="min-w-0 flex-1 text-sm text-slate-800 dark:text-slate-100">
                                    {renderInlineTokens(cleanText)}
                                </div>
                            </div>,
                        );
                    });
                } else if (secType === "numbered") {
                    sec.items.forEach((item, itemIdx) => {
                        const itemText =
                            typeof item === "string"
                                ? item
                                : (item as any)?.text || JSON.stringify(item);
                        const cleanText = itemText.replace(/^\d+[\.\)]\s*/, "");
                        bodyElements.push(
                            <div
                                key={`sec-num-${sIdx}-${itemIdx}`}
                                className="my-2.5 flex items-start gap-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200"
                            >
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                    {itemIdx + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    {renderInlineTokens(cleanText)}
                                </div>
                            </div>,
                        );
                    });
                } else if (secType === "chat" || docInfo.category === "slack") {
                    sec.items.forEach((item, itemIdx) => {
                        let sender = "";
                        let role = "";
                        let time = "";
                        let msg = "";

                        if (item && typeof item === "object") {
                            sender = (item as any).sender || `User`;
                            role = (item as any).role || "";
                            time = (item as any).time || "";
                            msg = (item as any).text || "";
                        } else if (typeof item === "string") {
                            const parsedChat = parseChatLine(item);
                            if (parsedChat) {
                                sender = parsedChat.sender;
                                role = parsedChat.role;
                                time = parsedChat.time;
                                msg = parsedChat.msg;
                            } else {
                                sender = `Speaker ${itemIdx + 1}`;
                                msg = item;
                            }
                        }

                        bodyElements.push(
                            renderChatMessage(
                                sender,
                                role,
                                time,
                                msg,
                                `sec-chat-${sIdx}-${itemIdx}`,
                            ),
                        );
                    });
                } else {
                    // Default bullet list
                    sec.items.forEach((item, itemIdx) => {
                        const itemText =
                            typeof item === "string"
                                ? item
                                : (item as any)?.text || JSON.stringify(item);
                        const cleanText = itemText.replace(/^[-*•]\s*/, "");
                        bodyElements.push(
                            <div
                                key={`sec-blt-${sIdx}-${itemIdx}`}
                                className="my-2 flex items-start gap-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200"
                            >
                                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                                <div className="min-w-0 flex-1">
                                    {renderInlineTokens(cleanText)}
                                </div>
                            </div>,
                        );
                    });
                }
            }
        });

        let docTitle = typeof structuredDoc.title === "object"
            ? ((structuredDoc.title as any)?.en || "")
            : String(structuredDoc.title || "");
        let cleanMetaHeader = metaHeader;

        if (docInfo.category === "slack") {
            const chMeta = cleanMetaHeader.find((m) =>
                typeof m?.key === "string" && m.key.toLowerCase().includes("channel"),
            );
            if (chMeta && typeof chMeta.value === "string") {
                const chName = chMeta.value.replace(/^#\s*/, "").trim();
                const isGenericOrChannel =
                    !docTitle ||
                    docTitle.toLowerCase() === "team discussion thread" ||
                    docTitle.toLowerCase().includes("channel") ||
                    docTitle.toLowerCase().replace(/[^a-z0-9]/g, "") ===
                        chName.toLowerCase().replace(/[^a-z0-9]/g, "") ||
                    docTitle.toLowerCase().includes(chName.toLowerCase());

                if (isGenericOrChannel) {
                    docTitle = `#${chName}`;
                    cleanMetaHeader = cleanMetaHeader.filter(
                        (m) => typeof m?.key === "string" && !m.key.toLowerCase().includes("channel"),
                    );
                }
            }
        }

        return {
            title: docTitle,
            metaHeader: cleanMetaHeader,
            metaFooter: [] as MetaItem[],
            bodyElements,
            docInfo,
        };
    }

    // Fallback: Legacy plain text / markdown parser
    let textStr = typeof text === "string" ? text : "";
    if (textStr) {
        textStr = textStr.split(/\n---\s*\n\s*QA\b/i)[0].split(/\nQA\s*\n\s*\[0\]/i)[0];
    }
    const rawLines = textStr
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    const docInfo = detectDocCategory(rawLines);
    const normalizedLines = preprocessDocumentLines(rawLines);

    let title = "";
    let workingLines = [...normalizedLines];

    // 1. Extract Document Title
    if (workingLines.length > 0) {
        const first = workingLines[0];
        if (/^#{1,3}\s+/.test(first)) {
            title = first.replace(/^#{1,3}\s+/, "").trim();
            workingLines = workingLines.slice(1);
        } else if (
            /^(?:incident\s*post[‑\-]mortem|architecture\s*decision\s*record|jira\s*user\s*story|meeting\s*minutes|scope\s*change\s*request|workplace\s*email)/i.test(
                first,
            )
        ) {
            title = first.trim();
            workingLines = workingLines.slice(1);
        }
    }

    // 2. Parse top metadata header
    const metaHeader: MetaItem[] = [];
    const metaRegex = /^\*{0,2}([A-Za-z0-9_.\-\s/&]+):\*{0,2}\s+(.+)$/;

    while (workingLines.length > 0) {
        const line = workingLines[0];
        if (line === "---" || line === "===") {
            workingLines = workingLines.slice(1);
            break;
        }

        const match = line.match(metaRegex);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            const lowerKey = key.toLowerCase();
            const isHeaderMeta =
                [
                    "channel",
                    "timestamp",
                    "reported by",
                    "author",
                    "date",
                    "time",
                    "date & attendees",
                    "incident",
                    "jira ticket",
                    "ticket",
                    "issue",
                    "status",
                    "severity",
                    "priority",
                    "owner",
                    "owner & status",
                    "attendees",
                    "subject",
                    "from",
                    "to",
                ].includes(lowerKey) || value.length < 90;

            if (isHeaderMeta) {
                metaHeader.push({ key, value });
                workingLines = workingLines.slice(1);
                continue;
            }
        }
        break;
    }

    // Elevate title from metaHeader if title was not extracted from markdown heading
    if (!title) {
        const titleMetaIdx = metaHeader.findIndex((m) =>
            /^(incident|jira\s*ticket|ticket|subject)$/i.test(m.key.trim()),
        );
        if (titleMetaIdx >= 0) {
            title = metaHeader[titleMetaIdx].value;
            metaHeader.splice(titleMetaIdx, 1);
        }
    }

    // 3. Extract footer metadata
    const metaFooter: MetaItem[] = [];
    const lastDividerIdx = workingLines.lastIndexOf("---");
    if (lastDividerIdx >= 0 && lastDividerIdx >= workingLines.length - 4) {
        const footerLines = workingLines.slice(lastDividerIdx + 1);
        const isAllMeta = footerLines.every((l) =>
            metaRegex.test(l.replace(/^[-*•]\s+/, "")),
        );
        if (isAllMeta && footerLines.length > 0) {
            for (const fl of footerLines) {
                const m = fl.replace(/^[-*•]\s+/, "").match(metaRegex);
                if (m) {
                    metaFooter.push({ key: m[1].trim(), value: m[2].trim() });
                }
            }
            workingLines = workingLines.slice(0, lastDividerIdx);
        }
    } else {
        let footerCount = 0;
        for (
            let idx = workingLines.length - 1;
            idx >= Math.max(0, workingLines.length - 4);
            idx--
        ) {
            const lineClean = workingLines[idx].replace(/^[-*•]\s+/, "");
            const m = lineClean.match(metaRegex);
            if (
                m &&
                /^(owner|status|signed[- ]off|verified|next\s*review|incident\s*owner|review)/i.test(
                    m[1].trim(),
                )
            ) {
                footerCount++;
            } else {
                break;
            }
        }
        if (footerCount > 0) {
            const footerLines = workingLines.slice(
                workingLines.length - footerCount,
            );
            for (const fl of footerLines) {
                const lineClean = fl.replace(/^[-*•]\s+/, "");
                const m = lineClean.match(metaRegex);
                if (m) {
                    metaFooter.push({ key: m[1].trim(), value: m[2].trim() });
                }
            }
            workingLines = workingLines.slice(0, workingLines.length - footerCount);
        }
    }

    // 4. Parse body lines
    const bodyElements: ReactNode[] = [];
    const numListRegex = /^(\d+)[\.\)]\s+(.*)$/;
    const bulletListRegex = /^[-*•]\s+(.*)$/;

    let currentSection = "";
    let i = 0;
    while (i < workingLines.length) {
        const line = workingLines[i];

        if (line === "---" || line === "===") {
            currentSection = "";
            bodyElements.push(
                <hr
                    key={`hr-${i}`}
                    className="my-4 border-t border-slate-200 dark:border-slate-800"
                />,
            );
            i++;
            continue;
        }

        // Subheadings: `### Title` or `## Title`
        if (/^#{2,4}\s+/.test(line)) {
            const subTitle = line.replace(/^#{2,4}\s+/, "").trim();
            currentSection = subTitle.toLowerCase();
            const {
                icon: SecIcon,
                colorClass,
                borderClass,
            } = getSectionIconAndColor(docInfo.category, subTitle);
            bodyElements.push(
                <h4
                    key={`h-${i}`}
                    className={`mb-2 mt-5 flex items-center gap-2 border-b ${borderClass} pb-1.5 text-sm font-bold uppercase tracking-wider text-slate-900 dark:border-slate-800/80 dark:text-white`}
                >
                    <SecIcon className={`h-3.5 w-3.5 ${colorClass}`} />
                    {renderInlineTokens(subTitle)}
                </h4>,
            );
            i++;
            continue;
        }

        // Standalone Section Heading
        const sectionHeadingMatch = line.match(
            /^\*{0,2}(Incident Summary|Root Cause|Corrective Actions|Preventive Measures|Context|Decision|Consequences|Trade-offs|User Story|Acceptance Criteria|Discussion Points|Key Decisions|Action Items|Proposed Change|Business Justification|Impact Analysis|Milestones|Executive Summary|Risks & Mitigations|Next Steps|Overview|Message|Body)(?:\s*\([^)]*\))?:\*{0,2}\s*$/i,
        );
        if (sectionHeadingMatch) {
            const headText = sectionHeadingMatch[1].trim();
            currentSection = headText.toLowerCase();
            const {
                icon: SecIcon,
                colorClass,
                borderClass,
            } = getSectionIconAndColor(docInfo.category, headText);
            bodyElements.push(
                <h4
                    key={`sh-${i}`}
                    className={`mb-2.5 mt-5 flex items-center gap-2 border-b ${borderClass} pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 dark:border-slate-800/80 dark:text-white`}
                >
                    <SecIcon className={`h-3.5 w-3.5 ${colorClass}`} />
                    {headText}
                </h4>,
            );
            i++;
            continue;
        }

        // Category specialized row handling
        if (
            docInfo.category === "meeting" &&
            currentSection.includes("action items")
        ) {
            bodyElements.push(renderActionItemCard(line, i));
            i++;
            continue;
        }

        if (
            docInfo.category === "meeting" &&
            currentSection.includes("key decisions")
        ) {
            const cleanText = line.replace(/^[-*•\d+.\)]\s*/, "");
            bodyElements.push(
                <div
                    key={`dec-${i}`}
                    className="my-2 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/30"
                >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {renderInlineTokens(cleanText)}
                    </div>
                </div>,
            );
            i++;
            continue;
        }

        if (
            docInfo.category === "incident" &&
            (currentSection.includes("incident summary") ||
                currentSection.includes("overview"))
        ) {
            bodyElements.push(
                <div key={`inc-sum-${i}`}>{renderIncidentSummary(line)}</div>,
            );
            i++;
            continue;
        }

        if (
            docInfo.category === "incident" &&
            currentSection.includes("root cause")
        ) {
            const cleanText = line.replace(/^[-*•\d+.\)]\s*/, "");
            bodyElements.push(
                <div
                    key={`rc-${i}`}
                    className="my-2 flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/60 dark:bg-amber-950/20"
                >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                        <AlertTriangle className="h-3 w-3" />
                    </span>
                    <div className="min-w-0 flex-1 text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-100">
                        {renderInlineTokens(cleanText)}
                    </div>
                </div>,
            );
            i++;
            continue;
        }

        if (
            docInfo.category === "incident" &&
            (currentSection.includes("corrective") ||
                currentSection.includes("preventive"))
        ) {
            const cleanText = line.replace(/^[-*•\d+.\)]\s*/, "");
            bodyElements.push(
                <div
                    key={`cor-${i}`}
                    className="my-2 flex items-start gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                >
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div className="min-w-0 flex-1 text-sm text-slate-800 dark:text-slate-100">
                        {renderInlineTokens(cleanText)}
                    </div>
                </div>,
            );
            i++;
            continue;
        }

        if (
            docInfo.category === "adr" &&
            (currentSection.includes("trade-offs") ||
                currentSection.includes("consequences"))
        ) {
            bodyElements.push(renderTradeOffItem(line, i));
            i++;
            continue;
        }

        if (
            docInfo.category === "jira" &&
            (currentSection.includes("user story") || /as an?\s+/i.test(line))
        ) {
            bodyElements.push(
                <div key={`story-${i}`}>{renderUserStoryCard(line)}</div>,
            );
            i++;
            continue;
        }

        if (docInfo.category === "email") {
            bodyElements.push(renderEmailBodyParagraph(line, i));
            i++;
            continue;
        }

        // Numbered list item
        const numMatch = line.match(numListRegex);
        if (numMatch) {
            const num = numMatch[1];
            const content = numMatch[2];
            bodyElements.push(
                <div
                    key={`num-${i}`}
                    className="my-2.5 flex items-start gap-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200"
                >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {num}
                    </span>
                    <div className="min-w-0 flex-1">{renderInlineTokens(content)}</div>
                </div>,
            );
            i++;
            continue;
        }

        // Bullet list item
        const bulletMatch = line.match(bulletListRegex);
        if (bulletMatch) {
            const content = bulletMatch[1];
            bodyElements.push(
                <div
                    key={`bullet-${i}`}
                    className="my-2 flex items-start gap-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200"
                >
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                    <div className="min-w-0 flex-1">{renderInlineTokens(content)}</div>
                </div>,
            );
            i++;
            continue;
        }

        // Slack chat line
        const parsedChat = parseChatLine(line);
        if (parsedChat) {
            bodyElements.push(
                renderChatMessage(
                    parsedChat.sender,
                    parsedChat.role,
                    parsedChat.time,
                    parsedChat.msg,
                    `chat-${i}`,
                ),
            );
            i++;
            continue;
        }

        // Paragraph starting with `**Field:** description`
        const leadInMatch = line.match(/^\*\*([A-Za-z0-9_.\-\s/]+):\*\*\s*(.*)$/);
        if (leadInMatch) {
            const label = leadInMatch[1].trim();
            const rest = leadInMatch[2].trim();
            bodyElements.push(
                <div
                    key={`p-${i}`}
                    className="my-3 text-sm leading-7 text-slate-700 dark:text-slate-200"
                >
                    <strong className="mr-1.5 font-bold text-slate-950 dark:text-white">
                        {label}:
                    </strong>
                    {renderInlineTokens(rest)}
                </div>,
            );
            i++;
            continue;
        }

        // Normal text paragraph
        bodyElements.push(
            <p
                key={`p-${i}`}
                className="my-2.5 text-sm leading-7 text-slate-700 dark:text-slate-200"
            >
                {renderInlineTokens(line)}
            </p>,
        );
        i++;
    }

    let cleanMetaHeader = metaHeader;
    if (docInfo.category === "slack") {
        const chMeta = cleanMetaHeader.find((m) =>
            typeof m?.key === "string" && m.key.toLowerCase().includes("channel"),
        );
        if (chMeta && typeof chMeta.value === "string") {
            const chName = chMeta.value.replace(/^#\s*/, "").trim();
            const isGenericOrChannel =
                !title ||
                title.toLowerCase() === "team discussion thread" ||
                title.toLowerCase().includes("channel") ||
                title.toLowerCase().replace(/[^a-z0-9]/g, "") ===
                    chName.toLowerCase().replace(/[^a-z0-9]/g, "") ||
                title.toLowerCase().includes(chName.toLowerCase());

            if (isGenericOrChannel) {
                title = `#${chName}`;
                cleanMetaHeader = cleanMetaHeader.filter(
                    (m) => typeof m?.key === "string" && !m.key.toLowerCase().includes("channel"),
                );
            }
        } else if (!title) {
            title = "Team Discussion Thread";
        }
    }

    return {
        title,
        metaHeader: cleanMetaHeader,
        metaFooter,
        bodyElements,
        docInfo,
    };
}
