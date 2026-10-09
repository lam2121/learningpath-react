import type { ReactNode } from "react";
import { RubyText } from "@/common/component/RubyText";
import { User, Hash } from "lucide-react";
import type { DocCategory } from "../type/technicalDocument";

export function detectLanguage(text: any, explicitLang?: string): "en" | "ja" | "vi" {
    if (explicitLang === "ja" || explicitLang === "vi" || explicitLang === "en") {
        return explicitLang;
    }
    const sample = typeof text === "string" ? text : JSON.stringify(text || "");
    if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(sample)) {
        return "ja";
    }
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(sample)) {
        return "vi";
    }
    return "en";
}

export function getLocalizedBadgeLabel(category: DocCategory, lang: "en" | "ja" | "vi"): string {
    switch (category) {
        case "email":
            return lang === "ja" ? "社内メール・メモ" : lang === "vi" ? "Bản ghi nhớ / Email nội bộ" : "Workplace Email Memo";
        case "incident":
            return lang === "ja" ? "インシデント事後検証 (RCA)" : lang === "vi" ? "Báo cáo sự cố (RCA)" : "Incident Post-Mortem (RCA)";
        case "adr":
            return lang === "ja" ? "アーキテクチャ決定記録 (ADR)" : lang === "vi" ? "Hồ sơ quyết định kiến trúc (ADR)" : "Architecture Decision Record (ADR)";
        case "jira":
            return lang === "ja" ? "Jira ユーザーストーリー・受入基準" : lang === "vi" ? "Jira User Story & Tiêu chí chấp nhận" : "Jira User Story & Acceptance Criteria";
        case "meeting":
            return lang === "ja" ? "議事録・アクションアイテム" : lang === "vi" ? "Biên bản cuộc họp & Nhiệm vụ" : "Meeting Minutes & Action Items";
        case "change_request":
            return lang === "ja" ? "スコープ変更要求 (CR)" : lang === "vi" ? "Yêu cầu thay đổi phạm vi (CR)" : "Scope Change Request (CR)";
        case "status_report":
            return lang === "ja" ? "エグゼクティブ進捗報告" : lang === "vi" ? "Báo cáo tiến độ quản trị" : "Executive Status Report";
        case "slack":
            return lang === "ja" ? "チームディスカッション" : lang === "vi" ? "Thảo luận nhóm" : "Team Discussion Thread";
        default:
            return lang === "ja" ? "業務技術仕様書" : lang === "vi" ? "Tài liệu kỹ thuật nơi làm việc" : "Workplace Technical Document";
    }
}

export function localizeMetaKey(rawKey: string, lang: "en" | "ja" | "vi"): string {
    if (lang === "en" || !rawKey) return rawKey;
    const clean = rawKey.trim().toLowerCase();
    const mapJa: Record<string, string> = {
        author: "作成者",
        authors: "作成者",
        recipient: "宛先",
        recipients: "宛先",
        status: "ステータス",
        state: "状態",
        date: "日付",
        sent: "送信日時",
        timestamp: "日時",
        time: "時間",
        severity: "重要度",
        priority: "優先度",
        version: "バージョン",
        "target release": "対象リリース",
        "target date": "目標期日",
        "story points": "ストーリーポイント",
        points: "ポイント",
        estimate: "見積もり",
        "project health": "プロジェクト健全度",
        health: "健全度",
        scope: "スコープ",
        impact: "影響範囲",
        environment: "環境",
        assignee: "担当者",
        reporter: "報告者",
        component: "コンポーネント",
        timeline: "タイムライン",
        category: "カテゴリ",
        system: "システム",
        module: "モジュール",
        "issue id": "課題ID",
        "ticket id": "チケットID",
        ticket: "チケット",
        "cr id": "変更要求ID",
        "reviewed by": "レビュー担当",
        reviewer: "レビュアー",
        approver: "承認者",
        approved: "承認状況",
        subject: "件名",
        from: "差出人",
        to: "宛先",
        attendees: "出席者",
        participants: "参加者",
    };
    const mapVi: Record<string, string> = {
        author: "Người tạo",
        authors: "Người tạo",
        recipient: "Người nhận",
        recipients: "Người nhận",
        status: "Trạng thái",
        state: "Trạng thái",
        date: "Ngày",
        sent: "Thời gian gửi",
        timestamp: "Thời gian",
        time: "Thời gian",
        severity: "Mức độ nghiêm trọng",
        priority: "Độ ưu tiên",
        version: "Phiên bản",
        "target release": "Bản phát hành mục tiêu",
        "target date": "Ngày mục tiêu",
        "story points": "Điểm ước lượng",
        points: "Điểm",
        estimate: "Ước lượng",
        "project health": "Tình trạng dự án",
        health: "Tình trạng",
        scope: "Phạm vi",
        impact: "Mức độ ảnh hưởng",
        environment: "Môi trường",
        assignee: "Người phụ trách",
        reporter: "Người báo cáo",
        component: "Thành phần",
        timeline: "Tiến độ",
        category: "Danh mục",
        system: "Hệ thống",
        module: "Mô-đun",
        "issue id": "Mã sự cố",
        "ticket id": "Mã ticket",
        ticket: "Ticket",
        "cr id": "Mã yêu cầu",
        "reviewed by": "Người duyệt",
        reviewer: "Người thẩm định",
        approver: "Người phê duyệt",
        approved: "Trạng thái duyệt",
        subject: "Tiêu đề",
        from: "Người gửi",
        to: "Người nhận",
        attendees: "Người tham dự",
        participants: "Người tham gia",
    };
    if (lang === "ja") return mapJa[clean] || rawKey;
    if (lang === "vi") return mapVi[clean] || rawKey;
    return rawKey;
}

/**
 * Parses inline markdown:
 * - `**bold**` -> strong
 * - `*term*` -> emphasized technical keyword badge
 * - `code` -> inline code
 * - `@username` -> mention badge
 * - `#channel` -> channel badge
 * - BDD Given/When/Then tags
 */
export function renderInlineTokens(raw: string): ReactNode[] {
    if (!raw) return [];

    const regex =
        /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|@[a-zA-Z0-9_.-]+|#[a-zA-Z0-9_\-\u2011]+|\b(?:Given|When|Then)\b)/g;

    const parts = raw.split(regex);
    return parts.map((part, index) => {
        if (!part) return null;

        if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
            const inner = part.slice(2, -2);
            return (
                <strong
                    key={`b-${index}`}
                    className="font-semibold text-slate-950 dark:text-white"
                >
                    {inner}
                </strong>
            );
        }

        if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
            const inner = part.slice(1, -1);
            return (
                <span
                    key={`em-${index}`}
                    className="mx-0.5 inline-flex items-center rounded border border-blue-200/80 bg-blue-50/90 px-1.5 py-0.5 text-xs font-semibold text-blue-700 dark:border-blue-800/80 dark:bg-blue-950/60 dark:text-blue-300"
                >
                    {inner}
                </span>
            );
        }

        if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
            const inner = part.slice(1, -1);
            return (
                <code
                    key={`c-${index}`}
                    className="mx-0.5 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-pink-600 dark:bg-slate-800 dark:text-pink-400"
                >
                    {inner}
                </code>
            );
        }

        if (part.startsWith("@") && part.length >= 2) {
            return (
                <span
                    key={`at-${index}`}
                    className="mx-0.5 inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                    <User className="h-3 w-3 text-slate-400" />
                    {part}
                </span>
            );
        }

        if (part.startsWith("#") && part.length >= 2) {
            return (
                <span
                    key={`hash-${index}`}
                    className="mx-0.5 inline-flex items-center gap-0.5 rounded-md border border-indigo-200/70 bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-700 dark:border-indigo-800/70 dark:bg-indigo-950/50 dark:text-indigo-300"
                >
                    <Hash className="h-3 w-3 text-indigo-500" />
                    {part.slice(1)}
                </span>
            );
        }

        if (part === "Given") {
            return (
                <span
                    key={`bdd-${index}`}
                    className="inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-xs font-bold uppercase text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                >
                    {part}
                </span>
            );
        }
        if (part === "When") {
            return (
                <span
                    key={`bdd-${index}`}
                    className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold uppercase text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                >
                    {part}
                </span>
            );
        }
        if (part === "Then") {
            return (
                <span
                    key={`bdd-${index}`}
                    className="inline-flex items-center rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-bold uppercase text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                >
                    {part}
                </span>
            );
        }

        if (part.includes("[") && part.includes("|")) {
            return <RubyText key={`t-${index}`} text={part} />;
        }

        return <span key={`t-${index}`}>{part}</span>;
    });
}
