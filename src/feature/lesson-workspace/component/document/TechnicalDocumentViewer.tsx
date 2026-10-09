import { useMemo } from "react";
import {
    AlertTriangle,
    Bookmark,
    Calendar,
    Hash,
    Users,
} from "lucide-react";

// Re-export all types for 100% backwards compatibility
export type {
    ChatMessageItem,
    ParagraphSectionV2,
    ListSectionV2,
    ChatSectionV2,
    DocumentSectionV2,
    StructuredDocumentV2,
    DocumentSection,
    StructuredDocument,
    TechnicalDocumentViewerProps,
    MetaItem,
    DocCategory,
} from "@/feature/lesson-workspace/type/technicalDocument";

// Re-export all parsing and inline token utilities for 100% backwards compatibility
export {
    detectLanguage,
    getLocalizedBadgeLabel,
    localizeMetaKey,
    renderInlineTokens,
} from "@/feature/lesson-workspace/util/documentTokenUtils";

import type { TechnicalDocumentViewerProps } from "@/feature/lesson-workspace/type/technicalDocument";
import {
    detectLanguage,
    getLocalizedBadgeLabel,
    localizeMetaKey,
    renderInlineTokens,
} from "@/feature/lesson-workspace/util/documentTokenUtils";
import { pullMeta } from "./documentViewerTheme";
import { parseDocumentContent } from "./documentBodyParser";
import { renderAttendeesChips } from "./DocumentSpecialCards";

export function TechnicalDocumentViewer({
    text,
    schemaVersion,
    className = "",
    lang,
}: TechnicalDocumentViewerProps) {
    const effectiveLang = detectLanguage(text, lang);

    const parsed = useMemo(
        () => parseDocumentContent(text, schemaVersion, effectiveLang),
        [text, schemaVersion, effectiveLang],
    );

    if (parsed.isInvalid) {
        return (
            <div
                className={`rounded-2xl border border-amber-200 bg-amber-50/70 p-6 text-center shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20 ${className}`}
            >
                <AlertTriangle className="mx-auto h-8 w-8 text-amber-600 dark:text-amber-400" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {effectiveLang === "ja"
                        ? "ドキュメント内容を更新中"
                        : effectiveLang === "vi"
                          ? "Nội dung tài liệu đang được cập nhật"
                          : "Document Content Being Updated"}
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {effectiveLang === "ja"
                        ? "閲覧品質を向上させるため、ドキュメントのフォーマットを標準化しています。"
                        : effectiveLang === "vi"
                          ? "Tài liệu bài đọc đang được hệ thống chuẩn hóa để đảm bảo chất lượng hiển thị tốt nhất."
                          : "The reading document is being normalized for optimal presentation."}
                </p>
            </div>
        );
    }

    const { category, badgeColor, containerBorder, icon: Icon } = parsed.docInfo;
    const badgeLabel = getLocalizedBadgeLabel(category, effectiveLang);

    // Separate specialized metadata for custom headers
    const currentMeta = [...parsed.metaHeader];

    // Helper extractions (supporting both English and localized keys)
    const subjectPull = pullMeta(currentMeta, /^(subject|件名|tiêu đề|chủ đề)$/i);
    let workingMeta = subjectPull.remaining;

    const fromPull = pullMeta(workingMeta, /^(from|差出人|người gửi|từ)$/i);
    workingMeta = fromPull.remaining;

    const toPull = pullMeta(workingMeta, /^(to|宛先|người nhận|đến)$/i);
    workingMeta = toPull.remaining;

    const datePull = pullMeta(workingMeta, /^(date|timestamp|sent|time|日付|ngày|thời gian)$/i);
    workingMeta = datePull.remaining;

    const attendeesPull = pullMeta(
        workingMeta,
        /^(attendees|participants|present|date\s*&\s*attendees|出席者|người tham dự)$/i,
    );
    workingMeta = attendeesPull.remaining;

    let attendeesValue = attendeesPull.found?.value || "";
    let extractedDate = datePull.found?.value || "";

    if (attendeesValue) {
        const splitMatch = attendeesValue.match(
            /^(?:(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})\s*[-–—]\s*)?(.+)$/,
        );
        if (splitMatch && splitMatch[1]) {
            if (!extractedDate) extractedDate = splitMatch[1];
            attendeesValue = splitMatch[2].trim();
        }
    }

    const severityPull = pullMeta(
        workingMeta,
        /^(severity|priority|sev|重要度|mức độ nghiêm trọng)$/i,
    );
    workingMeta = severityPull.remaining;

    const statusPull = pullMeta(workingMeta, /^(status|state|ステータス|trạng thái)$/i);
    workingMeta = statusPull.remaining;

    const ticketPull = pullMeta(
        workingMeta,
        /^(jira\s*ticket|ticket|issue|key|incident|incident\s*id|cr|cr\s*id|チケット|課題ID)$/i,
    );
    workingMeta = ticketPull.remaining;

    const storyPointsPull = pullMeta(
        workingMeta,
        /^(story\s*points|points|estimate|ストーリーポイント|điểm ước lượng)$/i,
    );
    workingMeta = storyPointsPull.remaining;

    const healthPull = pullMeta(
        workingMeta,
        /^(project\s*health|health|rag|overall\s*status|プロジェクト健全度|tình trạng)$/i,
    );
    workingMeta = healthPull.remaining;

    // Final title normalization
    const displayTitle =
        category === "email" && subjectPull.found
            ? subjectPull.found.value
            : parsed.title;
    const cleanDisplayTitle =
        category === "email"
            ? displayTitle.replace(/^(subject|件名|tiêu đề|chủ đề)\s*:\s*/i, "")
            : displayTitle;

    return (
        <article
            className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:p-7 p-5 dark:border-slate-800 dark:bg-slate-900 ${containerBorder} ${className}`}
        >
            {/* Top Badge & Identifier Row */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800/80">
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${badgeColor}`}
                    >
                        {category === "incident" ? (
                            <span className="relative mr-0.5 flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                            </span>
                        ) : category === "slack" ? (
                            <span className="mr-0.5 h-2 w-2 rounded-full bg-emerald-500"></span>
                        ) : (
                            <Icon className="h-3.5 w-3.5" />
                        )}
                        {badgeLabel}
                    </span>

                    {/* Category-specific Top Chips */}
                    {category === "incident" && severityPull.found && (
                        <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-100 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
                            {severityPull.found.value}
                        </span>
                    )}

                    {category === "jira" && ticketPull.found && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-mono font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            <Bookmark className="h-3 w-3" />
                            {ticketPull.found.value}
                        </span>
                    )}

                    {category === "jira" && storyPointsPull.found && (
                        <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                            {storyPointsPull.found.value}
                        </span>
                    )}

                    {category === "status_report" && healthPull.found && (
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                                /green|track/i.test(healthPull.found.value)
                                    ? "border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                                    : /risk|amber|yellow/i.test(healthPull.found.value)
                                      ? "border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
                                      : "border border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
                            }`}
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                            {healthPull.found.value}
                        </span>
                    )}

                    {statusPull.found && (
                        <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                                /closed|resolved|completed|accepted|active/i.test(
                                    statusPull.found.value,
                                )
                                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                        >
                            {statusPull.found.value}
                        </span>
                    )}
                </div>

                {/* Top Right Date / Time Indicator */}
                {(extractedDate || datePull.found) && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{extractedDate || datePull.found?.value}</span>
                    </div>
                )}
            </div>

            {/* Document Title Header */}
            {cleanDisplayTitle && (
                <div className="mb-4">
                    {category === "slack" && cleanDisplayTitle.startsWith("#") ? (
                        <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-950 sm:text-xl dark:text-white">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300">
                                <Hash className="h-4 w-4" />
                            </span>
                            <span>{cleanDisplayTitle.replace(/^#\s*/, "")}</span>
                        </h3>
                    ) : category === "email" ? (
                        <h3 className="text-base font-semibold text-slate-900 sm:text-lg dark:text-white">
                            <span className="mr-1.5 font-bold text-sky-600 dark:text-sky-400">
                                {effectiveLang === "ja"
                                    ? "件名:"
                                    : effectiveLang === "vi"
                                      ? "Tiêu đề:"
                                      : "Subject:"}
                            </span>
                            {renderInlineTokens(cleanDisplayTitle)}
                        </h3>
                    ) : (
                        <h3 className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl dark:text-white">
                            {renderInlineTokens(cleanDisplayTitle)}
                        </h3>
                    )}
                </div>
            )}

            {/* 1. Specialized Email Header Box */}
            {category === "email" && (fromPull.found || toPull.found) && (
                <div className="mb-5 rounded-xl border border-sky-100 bg-sky-50/60 p-3.5 text-sm text-slate-800 dark:border-sky-950/60 dark:bg-sky-950/20 dark:text-slate-200">
                    <div className="space-y-1.5">
                        {fromPull.found && (
                            <div className="flex items-center gap-2">
                                <span className="w-16 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    {effectiveLang === "ja" ? "差出人:" : effectiveLang === "vi" ? "Người gửi:" : "From:"}
                                </span>
                                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-200 text-[10px] font-bold text-sky-800 dark:bg-sky-800 dark:text-sky-100">
                                        {fromPull.found.value.charAt(0).toUpperCase()}
                                    </span>
                                    <span>{renderInlineTokens(fromPull.found.value)}</span>
                                </div>
                            </div>
                        )}
                        {toPull.found && (
                            <div className="flex items-center gap-2">
                                <span className="w-16 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    {effectiveLang === "ja" ? "宛先:" : effectiveLang === "vi" ? "Người nhận:" : "To:"}
                                </span>
                                <div className="font-semibold text-slate-800 dark:text-slate-200">
                                    {renderInlineTokens(toPull.found.value)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 2. Specialized Meeting Attendees Chip Bar */}
            {category === "meeting" && attendeesValue && (
                <div className="mb-5 rounded-xl border border-amber-100 bg-amber-50/30 p-3.5 dark:border-amber-950/60 dark:bg-amber-950/20">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                        <Users className="h-3.5 w-3.5" />{" "}
                        {effectiveLang === "ja" ? "出席者" : effectiveLang === "vi" ? "Người tham dự" : "Attendees"}
                    </div>
                    {renderAttendeesChips(attendeesValue)}
                </div>
            )}

            {/* General Remaining Metadata Header Block */}
            {workingMeta.length > 0 && (
                <div className="mb-6 rounded-xl border border-slate-200/90 bg-slate-50/90 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                        {workingMeta.map((item, idx) => (
                            <div
                                key={`mh-${idx}`}
                                className="flex flex-wrap items-center gap-2 text-xs"
                            >
                                <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    {localizeMetaKey(item.key, effectiveLang)}:
                                </span>
                                <div className="font-medium text-slate-800 dark:text-slate-100">
                                    {renderInlineTokens(item.value)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Document Body */}
            {category === "slack" ? (
                <div className="rounded-xl border border-teal-100/80 bg-teal-50/20 p-2 sm:p-3 dark:border-teal-950/50 dark:bg-slate-900/40">
                    <div className="space-y-0.5">{parsed.bodyElements}</div>
                </div>
            ) : (
                <div className="space-y-1">{parsed.bodyElements}</div>
            )}

            {/* Metadata Footer Block (e.g. Sign-off / Review status) */}
            {parsed.metaFooter.length > 0 && (
                <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-xs dark:bg-slate-800/50">
                        {parsed.metaFooter.map((item, idx) => (
                            <div key={`mf-${idx}`} className="flex items-center gap-2">
                                <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    {localizeMetaKey(item.key, effectiveLang)}:
                                </span>
                                <span className="font-medium text-slate-800 dark:text-slate-100">
                                    {renderInlineTokens(item.value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </article>
    );
}
