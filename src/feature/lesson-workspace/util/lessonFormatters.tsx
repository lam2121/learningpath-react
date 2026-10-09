import type { ReactNode } from "react";
import {
    CircleHelp,
    FileText,
    Headphones,
    MessageSquareText,
    NotebookPen,
    ScrollText,
    Target,
    Volume2,
} from "lucide-react";
import { RubyText } from "@/common/component/RubyText";
import type { LessonLanguage } from "../context/LessonLanguageContext";
import type { SectionMeta, SidebarSectionKey } from "../type/lessonWorkspace";

export function localizeField(item: any, lang: LessonLanguage, fallback: string = ""): string {
    if (!item) return fallback;
    if (typeof item === "string") return item;
    if (typeof item === "object") {
        return item[lang] || item.en || item.vi || item.ja || fallback;
    }
    return String(item);
}

export function extractDocumentByLang(docInput: any, lang: LessonLanguage): any {
    if (!docInput) return docInput;
    let doc = docInput;
    if (typeof doc === "string") {
        const trimmed = doc.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            try {
                doc = JSON.parse(trimmed);
            } catch {
                return docInput;
            }
        } else {
            return docInput;
        }
    }
    if (typeof doc !== "object") return doc;

    const ext = (val: any) => localizeField(val, lang);

    return {
        ...doc,
        doc_type: doc.doc_type ? (ext(doc.doc_type) || doc.doc_type) : doc.doc_type,
        title: doc.title ? (ext(doc.title) || doc.title) : doc.title,
        metadata: Array.isArray(doc.metadata)
            ? doc.metadata.map((m: any) => ({
                key: ext(m.key) || m.key,
                value: ext(m.value) || m.value,
            }))
            : [],
        sections: Array.isArray(doc.sections)
            ? doc.sections.map((sec: any) => {
                const heading = ext(sec.heading) || sec.heading || "";
                if (sec.type === "paragraph") {
                    return {
                        ...sec,
                        heading,
                        content: ext(sec.content) || sec.content || "",
                    };
                }
                if (sec.type === "bullet" || sec.type === "numbered") {
                    return {
                        ...sec,
                        heading,
                        items: Array.isArray(sec.items)
                            ? sec.items.map((it: any) => ext(it) || String(it || ""))
                            : [],
                    };
                }
                if (sec.type === "chat") {
                    return {
                        ...sec,
                        heading,
                        items: Array.isArray(sec.items)
                            ? sec.items.map((it: any) => ({
                                ...it,
                                sender: ext(it.sender) || it.sender,
                                role: ext(it.role) || it.role,
                                text: ext(it.text) || String(it.text || ""),
                            }))
                            : [],
                    };
                }
                return { ...sec, heading };
            })
            : [],
    };
}

export const SECTION_META: SectionMeta[] = [
    { key: "scenario", label: "Scenario", eyebrow: "Context", icon: ScrollText },
    {
        key: "vocab",
        label: "Vocabulary & Pronunciation",
        eyebrow: "Speaking & Terms",
        icon: Volume2,
    },
    { key: "phrases", label: "Phrases", eyebrow: "Patterns", icon: NotebookPen },
    { key: "reading", label: "Reading", eyebrow: "Document", icon: FileText },
    {
        key: "dialogue",
        label: "Dialogue",
        eyebrow: "Exchange",
        icon: MessageSquareText,
    },
    {
        key: "listening",
        label: "Listening",
        eyebrow: "Audio Track",
        icon: Headphones,
    },
    { key: "wrapup", label: "Wrap-up", eyebrow: "Review", icon: Target },
    { key: "quiz", label: "Quiz", eyebrow: "C-2", icon: CircleHelp },
];

export const SECTION_I18N: Record<
    SidebarSectionKey,
    {
        label: { en: string; vi: string; ja: string };
        eyebrow: { en: string; vi: string; ja: string };
    }
> = {
    scenario: {
        eyebrow: { en: "Context", vi: "Ngữ cảnh", ja: "コンテキスト" },
        label: { en: "Scenario", vi: "Tình huống", ja: "シナリオ" },
    },
    vocab: {
        eyebrow: { en: "Speaking & Terms", vi: "Từ vựng & Thuật ngữ", ja: "スピーキング・用語" },
        label: { en: "Vocabulary & Pronunciation", vi: "Từ vựng & Phát âm", ja: "語彙と発音" },
    },
    phrases: {
        eyebrow: { en: "Patterns", vi: "Mẫu câu", ja: "パターン" },
        label: { en: "Phrases", vi: "Cụm từ then chốt", ja: "キーフレーズ" },
    },
    reading: {
        eyebrow: { en: "Document", vi: "Tài liệu", ja: "ドキュメント" },
        label: { en: "Reading", vi: "Bài đọc kỹ thuật", ja: "リーディング" },
    },
    dialogue: {
        eyebrow: { en: "Exchange", vi: "Hội thoại", ja: "対話" },
        label: { en: "Dialogue", vi: "Đoạn đối thoại", ja: "ダイアログ" },
    },
    listening: {
        eyebrow: { en: "Audio Track", vi: "Băng ghi âm", ja: "音声トラック" },
        label: { en: "Listening", vi: "Luyện nghe", ja: "リスニング" },
    },
    wrapup: {
        eyebrow: { en: "Review", vi: "Ôn tập", ja: "復習" },
        label: { en: "Wrap-up", vi: "Tổng kết bài học", ja: "まとめ" },
    },
    quiz: {
        eyebrow: { en: "C-2", vi: "C-2", ja: "C-2" },
        label: { en: "Quiz", vi: "Bài kiểm tra", ja: "クイズ" },
    },
};

export function getSectionTitle(key: SidebarSectionKey, lang: LessonLanguage): string {
    return SECTION_I18N[key]?.label[lang] || SECTION_META.find((m) => m.key === key)?.label || key;
}

export function getSectionEyebrowNumber(index: number, lang: LessonLanguage): string {
    if (lang === "ja") return `セクション ${index}`;
    if (lang === "vi") return `Phần ${index}`;
    return `Section ${index}`;
}

export function formatTrack(track: string, lang: LessonLanguage) {
    const t = (track || "").toLowerCase();
    if (lang === "ja") {
        if (t === "beginner" || t === "basic") return "初級トラック";
        if (t === "intermediate") return "中級トラック";
        if (t === "advanced") return "上級トラック";
        return `${formatLabel(track)} トラック`;
    }
    if (lang === "vi") {
        if (t === "beginner" || t === "basic") return "Lộ trình Cơ bản";
        if (t === "intermediate") return "Lộ trình Trung cấp";
        if (t === "advanced") return "Lộ trình Nâng cao";
        return `Lộ trình ${formatLabel(track)}`;
    }
    if (t === "basic" || t === "beginner") return "Basic Track";
    if (t === "intermediate") return "Intermediate Track";
    if (t === "advanced") return "Advanced Track";
    return `${formatLabel(track)} Track`;
}

export function formatSkill(skill: string, _lang?: LessonLanguage) {
    const s = (skill || "").toLowerCase();
    if (s.includes("comm")) return "C Comm";
    if (s.includes("doc")) return "D Doc";
    if (s.includes("trouble")) return "T Trouble";
    return formatLabel(skill);
}

export function formatDifficulty(tier: string, lang: LessonLanguage) {
    const t = (tier || "").toLowerCase();
    if (lang === "ja") {
        if (t === "beginner") return "初級";
        if (t === "intermediate") return "中級";
        if (t === "advanced") return "上級";
        return formatLabel(tier);
    }
    if (lang === "vi") {
        if (t === "beginner") return "Cơ bản";
        if (t === "intermediate") return "Trung cấp";
        if (t === "advanced") return "Nâng cao";
        return formatLabel(tier);
    }
    return formatLabel(tier);
}

export function formatLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export function formatPercent(value: number) {
    return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

export function formatScenarioParagraphs(text: string): string[] {
    if (!text) return [];
    return text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);
}

export const KNOWN_TEACHER_NOTES: Record<string, { vi: string; ja: string }> = {
    // 1. Scenario
    "Focus on balancing engineering sustainability with stakeholder timeline pressures. The PM must not choose a side blindly but facilitate a trade-off discussion backed by empirical metrics.": {
        vi: "Tập trung vào việc cân bằng giữa tính bền vững kỹ thuật và áp lực tiến độ từ các bên liên quan. Quản lý dự án không được thiên vị một bên một cách mù quáng mà cần điều phối buổi thảo luận về sự đánh đổi dựa trên số liệu thực tế.",
        ja: "エンジニアリングの[持続可能性|じぞくかのうせい]とステークホルダーのスケジュール[圧力|あつりょく]のバランスに[焦点|しょうてん]を[当|あ]てます。PMは[盲目的|もうもくてき]にどちらかの[側|がわ]に[味方|みかた]するのではなく、[客観的|きゃっかんてき]な[測定指標|そくていしひょう]に[基|づ]づいてトレードオフの[議論|ぎろん]を[促進|そくしん]する[必要|ひつよう]があります。",
    },
    // 2. Vocab
    "Ensure learners can distinguish between noun phrases (technical debt, bottleneck) and active technical verbs (refactor, mitigate) in spoken project management discussions.": {
        vi: "Đảm bảo học viên phân biệt được giữa các cụm danh từ (nợ kỹ thuật, nút thắt cổ chai) và các động từ kỹ thuật chủ động (tái cấu trúc, giảm thiểu) trong các cuộc thảo luận quản lý dự án.",
        ja: "プロジェクトマネジメントの[会話|かいわ]において、[学習者|がくしゅうしゃ]が[名詞句|めいしく]（[技術的負債|ぎじゅつてきふさい]、ボトルネック）と能動的な[技術動詞|ぎじゅつどうし]（リファクタリングする、[軽減|けいげん]する）を[明確|めいかく]に[区別|くべつ]できることを[確認|かくにん]してください。",
    },
    // 3. Phrases
    "Verify that learners use the exact stem templates and ensure phrases p3, p4, and p5 strictly avoid starting with banned pronouns.": {
        vi: "Kiểm tra để đảm bảo học viên sử dụng chính xác các mẫu câu khung và đảm bảo các cụm từ p3, p4, p5 tuyệt đối không bắt đầu bằng các đại từ bị cấm.",
        ja: "[学習者|がくしゅうしゃ]が[正確|せいかく]なフレーズのステムテンプレートを[使用|しよう]しているかを[確認|かくにん]し、フレーズp3、p4、p5において[不要|ふよう]な[主語代名詞|しゅごだいめいし]で[始|はじ]まらないよう[徹底|てってい]してください。",
    },
    // 4. Reading
    "Ensure students understand how executive memos balance technical reality with business requirements. The QA exercises test both literal comprehension and strategic inference.": {
        vi: "Đảm bảo học viên hiểu cách các bản ghi nhớ điều hành cân bằng giữa thực tế kỹ thuật và yêu cầu kinh doanh. Các bài tập hỏi đáp kiểm tra cả khả năng hiểu nghĩa đen lẫn suy luận chiến lược.",
        ja: "エグゼクティブメモがどのように[技術的|ぎじゅつてき]な[現実|げんじつ]とビジネス[要件|ようけん]のバランスを[取|と]っているかを[生徒|せいと]が[理解|りかい]していることを[確認|かくにん]してください。QA[演習|えんしゅう]では、[文字通|もじどお]りの[読解力|どっかいりょく]と[戦略的|せんりゃくてき]な[推論力|すいろんりょく]の[双方|そうほう]をテストします。",
    },
    // 5. Dialogue
    "Ensure learners practice tone modulation when shifting from inquiry (p1, p2) to strategic proposal (p3, p4). Check that suggested completions are distinct from phrase items.": {
        vi: "Đảm bảo học viên thực hành điều chỉnh ngữ điệu khi chuyển từ câu hỏi thăm dò (p1, p2) sang đề xuất chiến lược (p3, p4). Kiểm tra để phần hoàn thành gợi ý khác biệt với các mục cụm từ.",
        ja: "[質問|しつもん]（p1、p2）から[戦略的|せんりゃくてき]な[提案|ていあん]（p3、p4）へと[移行|いこう]する[際|さい]のトーンの[切|き]り[替|か]えを[学習者|がくしゅうしゃ]に[練習|れんしゅう]させてください。[提案|ていあん]された[補完|ほかん]テキストがフレーズ[項目|こうもく]と[重複|じゅうふく]していないことを[確認|かくにん]します。",
    },
    // 6. Listening
    "Focus listening practice on extracting metrics (20% traffic increase) and strategic solutions from senior leadership monologues.": {
        vi: "Tập trung phần luyện nghe vào việc trích xuất các số liệu cụ thể (lưu lượng truy cập tăng 20%) và các giải pháp chiến lược từ bài phát biểu của lãnh đạo cấp cao.",
        ja: "シニアリーダーシップのモノローグから、[具体的|ぐたいてき]な[指標|しひょう]（トラフィック20%[増加|ぞうか]）と[戦略的|せんりゃくてき][解決策|かいけつさく]を[正確|せいかく]に[聞|き]き[取|と]ることに[集中|しゅうちゅう]させます。",
    },
    // 7. Wrapup
    "Ensure learners complete the action task by applying professional tone, clear trade-off framing, and specific lesson vocabulary in their written communication.": {
        vi: "Đảm bảo học viên hoàn thành nhiệm vụ thực hành bằng cách áp dụng giọng văn chuyên nghiệp, định hình sự đánh đổi rõ ràng và sử dụng từ vựng cụ thể của bài học trong văn bản giao tiếp.",
        ja: "[学習者|がくしゅうしゃ]が[専門的|せんもんてき]なトーン、[明確|めいかく]なトレードオフの[提示|ていじ]、およびレッスンで[学|まな]んだ[具体的|ぐたいてき]な[語彙|ごい]を[書面|しょめん]コミュニケーションに[適用|てきよう]して、アクションタスクを[完了|かんりょう]することを[確認|かくにん]してください。",
    },
};

export function localizeTeacherNote(noteInput: any, lang: LessonLanguage): { en: string; loc: string | null } {
    if (!noteInput) return { en: "", loc: null };

    // Case 1: Object with en/vi/ja
    if (typeof noteInput === "object") {
        const en = String(noteInput.en || "");
        const loc = lang !== "en" ? String(noteInput[lang] || "") : null;
        if (loc && loc !== en) {
            return { en, loc };
        }
        // If object has en but missing vi/ja, check dictionary
        if (en && lang !== "en") {
            const trimmedEn = en.trim();
            const dictMatch = KNOWN_TEACHER_NOTES[trimmedEn];
            if (dictMatch && dictMatch[lang as "vi" | "ja"]) {
                return { en, loc: dictMatch[lang as "vi" | "ja"] };
            }
        }
        return { en: en || String(noteInput.vi || noteInput.ja || ""), loc: null };
    }

    // Case 2: String
    const noteStr = String(noteInput).trim();
    if (!noteStr) return { en: "", loc: null };

    if (lang === "en") {
        return { en: noteStr, loc: null };
    }

    // Check exact match in dictionary
    const dictMatch = KNOWN_TEACHER_NOTES[noteStr];
    if (dictMatch && dictMatch[lang as "vi" | "ja"]) {
        return { en: noteStr, loc: dictMatch[lang as "vi" | "ja"] };
    }

    // Check partial/trimmed match in dictionary
    for (const [key, trans] of Object.entries(KNOWN_TEACHER_NOTES)) {
        if (noteStr.includes(key) || key.includes(noteStr)) {
            return { en: noteStr, loc: trans[lang as "vi" | "ja"] };
        }
    }

    return { en: noteStr, loc: null };
}

export function renderBilingualNote(
    rawNote: any,
    fallbackNote: string | undefined,
    lang: LessonLanguage,
    showFurigana: boolean,
): ReactNode {
    const { en: noteEn, loc: noteLoc } = localizeTeacherNote(rawNote || fallbackNote, lang);
    if (!noteEn && !noteLoc) return undefined;
    if (!noteLoc || noteLoc === noteEn) return noteEn;
    return (
        <div className="space-y-1">
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{noteEn}</div>
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {lang === "ja" ? <RubyText text={noteLoc} showFurigana={showFurigana} /> : noteLoc}
            </div>
        </div>
    );
}
