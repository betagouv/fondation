import { useLayoutEffect, useState, useRef, type RefObject } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

const EXPAND_BUTTON_CLASS = 'ml-1 cursor-pointer underline';

export function ExpandableText(props: { className?: string; lines?: number; text: string }) {
  const intl = useIntl();
  const lines = props.lines ?? 3;
  const paragraph = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);

  const expandLabel = intl.formatMessage({ defaultMessage: 'Afficher plus' });
  const clampEnd = useClampEnd(paragraph, props.text, lines, expandLabel);

  const isClamped = clampEnd !== null;
  const showTruncated = isClamped && !expanded;
  const visibleText = showTruncated ? props.text.slice(0, clampEnd).trimEnd() : props.text;

  return (
    <p className={`fr-mb-0 whitespace-pre-line ${props.className ?? ''}`} ref={paragraph}>
      {visibleText}
      {showTruncated && '…'}
      {isClamped && (
        <button
          aria-expanded={expanded}
          className={EXPAND_BUTTON_CLASS}
          onClick={() => setExpanded((value) => !value)}
          type="button"
        >
          {expanded ? (
            <FormattedMessage defaultMessage="Afficher moins" />
          ) : (
            <FormattedMessage defaultMessage="Afficher plus" />
          )}
        </button>
      )}
    </p>
  );
}

function useClampEnd(
  paragraph: RefObject<HTMLParagraphElement | null>,
  text: string,
  lines: number,
  expandLabel: string,
) {
  const [clampEnd, setClampEnd] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = paragraph.current;
    if (!element) return;

    const measure = () => setClampEnd(findClampEnd(element, text, lines, expandLabel));
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [paragraph, text, lines, expandLabel]);

  return clampEnd;
}

function findClampEnd(element: HTMLElement, text: string, lines: number, expandLabel: string): number | null {
  const measurer = element.cloneNode() as HTMLElement;
  Object.assign(measurer.style, {
    display: '-webkit-box',
    overflow: 'hidden',
    pointerEvents: 'none',
    position: 'absolute',
    visibility: 'hidden',
    webkitBoxOrient: 'vertical',
    webkitLineClamp: String(lines),
    width: `${element.clientWidth}px`,
  });
  element.before(measurer);

  const expandButton = document.createElement('button');
  expandButton.className = EXPAND_BUTTON_CLASS;
  expandButton.textContent = expandLabel;

  try {
    measurer.textContent = text;
    if (measurer.scrollHeight <= measurer.clientHeight + 1) return null;

    const fits = (visibleText: string) => {
      measurer.replaceChildren(`${visibleText}…`, expandButton);
      return expandButton.offsetTop + expandButton.offsetHeight <= measurer.clientHeight + 1;
    };

    let low = 0;
    let high = text.length;
    let best = 0;
    while (low <= high) {
      const middle = (low + high) >> 1;
      if (fits(text.slice(0, middle).trimEnd())) {
        best = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }
    return best;
  } finally {
    measurer.remove();
  }
}
