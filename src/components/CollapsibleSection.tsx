// Collapsible section component for accordion-style toolbar

import { useState, useRef, useEffect } from 'react';

interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  defaultExpanded = false,
  children,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(
    defaultExpanded ? undefined : 0
  );

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(isExpanded ? height : 0);
    }
  }, [isExpanded, children]);

  return (
    <div style={styles.container}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={styles.header}
        aria-expanded={isExpanded}
      >
        <span
          style={{
            ...styles.chevron,
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          ▶
        </span>
        <span style={styles.title}>{title}</span>
      </button>
      <div
        style={{
          ...styles.content,
          maxHeight: contentHeight !== undefined ? `${contentHeight}px` : 'none',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div ref={contentRef} style={styles.inner}>
          {children}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    borderBottom: '1px solid #e0e0e0',
  },
  header: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
  },
  chevron: {
    fontSize: '10px',
    color: '#666',
    transition: 'transform 0.2s ease',
    display: 'inline-block',
  },
  title: {
    flex: 1,
  },
  content: {
    overflow: 'hidden',
    transition: 'max-height 0.25s ease, opacity 0.2s ease',
  },
  inner: {
    paddingBottom: '12px',
  },
};
