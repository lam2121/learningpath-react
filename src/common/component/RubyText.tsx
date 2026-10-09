import React, { useMemo } from "react";

interface RubyTextProps {
    text: string | null | undefined;
    showFurigana?: boolean;
    className?: string;
}

interface TextSegment {
    type: "text" | "ruby";
    base: string;
    reading?: string;
}

/**
 * Parses bracketed furigana text formatted as `[Kanji|reading]` into structured segments.
 * Example: `"[進捗|しんちょく]の[状況|じょうきょう]"`
 */
export function parseRubyText(text: string | null | undefined): TextSegment[] {
    if (!text || typeof text !== "string") return [];

    const rubyRegex = /\[([^|\]]+)\|([^\]]+)\]/g;
    const segments: TextSegment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = rubyRegex.exec(text)) !== null) {
        // Text before ruby bracket
        if (match.index > lastIndex) {
            segments.push({
                type: "text",
                base: text.substring(lastIndex, match.index),
            });
        }

        // Ruby bracket match
        segments.push({
            type: "ruby",
            base: match[1],
            reading: match[2],
        });

        lastIndex = rubyRegex.lastIndex;
    }

    // Trailing text
    if (lastIndex < text.length) {
        segments.push({
            type: "text",
            base: text.substring(lastIndex),
        });
    }

    return segments;
}

/**
 * Renders Japanese text containing `[Kanji|reading]` syntax using standard HTML5 `<ruby>` elements.
 * Accessible with `<rp>` fallback for browsers/readers that don't support ruby.
 */
export const RubyText: React.FC<RubyTextProps> = ({
    text,
    showFurigana = true,
    className,
}) => {
    const segments = useMemo(() => {
        if (!text) return [];
        return parseRubyText(text);
    }, [text]);

    if (!text || typeof text !== "string") return null;

    // Fast-path for plain text without any brackets
    if (segments.length === 1 && segments[0].type === "text") {
        return <span className={className}>{text}</span>;
    }

    return (
        <span className={className}>
            {segments.map((seg, idx) => {
                if (seg.type === "text") {
                    return <React.Fragment key={idx}>{seg.base}</React.Fragment>;
                }

                if (!showFurigana || !seg.reading) {
                    return <React.Fragment key={idx}>{seg.base}</React.Fragment>;
                }

                return (
                    <ruby key={idx} className="ruby-text inline-flex flex-col items-center">
                        <span className="ruby-base">{seg.base}</span>
                        <rp>(</rp>
                        <rt className="text-[0.62em] leading-none text-slate-500 font-normal select-none dark:text-slate-400">
                            {seg.reading}
                        </rt>
                        <rp>)</rp>
                    </ruby>
                );
            })}
        </span>
    );
};

export default RubyText;
