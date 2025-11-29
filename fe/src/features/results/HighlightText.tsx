import React, { useMemo } from 'react';
import clsx from 'clsx';
import styles from './HighlightText.module.css';
import type { HighlightSpan } from '../../core/types';

interface HighlightTextProps {
    text: string;
    highlights: HighlightSpan[];
    activeHighlightId?: string | null;
    onHighlightHover?: (id: string | null) => void;
}

export const HighlightText: React.FC<HighlightTextProps> = ({
    text,
    highlights,
    activeHighlightId,
    onHighlightHover
}) => {
    const segments = useMemo(() => {
        if (!highlights || highlights.length === 0) {
            return [{ text, isHighlight: false, id: null }];
        }

        // Sort highlights by start position
        const sorted = [...highlights].sort((a, b) => a.start - b.start);
        const result: Array<{ text: string; isHighlight: boolean; id: string | null }> = [];
        let currentPos = 0;

        sorted.forEach((h) => {
            // Text before highlight
            if (h.start > currentPos) {
                result.push({
                    text: text.slice(currentPos, h.start),
                    isHighlight: false,
                    id: null
                });
            }

            // Highlighted text
            result.push({
                text: text.slice(h.start, h.end),
                isHighlight: true,
                id: h.id
            });

            currentPos = h.end;
        });

        // Remaining text
        if (currentPos < text.length) {
            result.push({
                text: text.slice(currentPos),
                isHighlight: false,
                id: null
            });
        }

        return result;
    }, [text, highlights]);

    return (
        <div className={styles.container}>
            {segments.map((seg, i) => (
                seg.isHighlight ? (
                    <mark
                        key={i}
                        className={clsx(
                            styles.highlight,
                            activeHighlightId === seg.id && styles.active
                        )}
                        onMouseEnter={() => onHighlightHover?.(seg.id)}
                        onMouseLeave={() => onHighlightHover?.(null)}
                    >
                        {seg.text}
                    </mark>
                ) : (
                    <span key={i}>{seg.text}</span>
                )
            ))}
        </div>
    );
};
