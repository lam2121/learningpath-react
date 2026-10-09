import type { ComponentType } from "react";

export interface ChatMessageItem {
    sender: string;
    role?: string | null;
    time?: string | null;
    text: string;
}

export type ParagraphSectionV2 = {
    heading: string;
    type: "paragraph";
    content: string;
};

export type ListSectionV2 = {
    heading: string;
    type: "bullet" | "numbered";
    items: string[];
};

export type ChatSectionV2 = {
    heading: string;
    type: "chat";
    items: ChatMessageItem[];
};

export type DocumentSectionV2 = ParagraphSectionV2 | ListSectionV2 | ChatSectionV2;

export interface StructuredDocumentV2 {
    schema_version?: 2;
    doc_type: string;
    title: string;
    metadata: Array<{ key: string; value: string }>;
    sections: DocumentSectionV2[];
}

export interface DocumentSection {
    heading?: string;
    type?: "paragraph" | "bullet" | "numbered" | "chat" | string;
    content?: string;
    items?: Array<string | ChatMessageItem>;
}

export interface StructuredDocument {
    schema_version?: number;
    doc_type?: string;
    title?: string;
    metadata?: Array<{ key: string; value: string }>;
    sections?: DocumentSection[];
}

export interface TechnicalDocumentViewerProps {
    text: string | StructuredDocument | Record<string, any>;
    schemaVersion?: number;
    className?: string;
    lang?: "en" | "ja" | "vi" | string;
}

export interface MetaItem {
    key: string;
    value: string;
}

export type DocCategory =
    | "incident"
    | "adr"
    | "jira"
    | "slack"
    | "meeting"
    | "change_request"
    | "status_report"
    | "email"
    | "general";

export interface DocTheme {
    category: DocCategory;
    badgeLabel: string;
    badgeColor: string;
    containerBorder: string;
    headerBg: string;
    icon: ComponentType<{ className?: string }>;
    primaryColor: string;
}
