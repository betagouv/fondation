import pagedJsUrl from 'pagedjs/dist/paged.polyfill.min.js?url';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

// The frame inherits the CSP of the app, which runs no inline script: a plain file, as Vite would inline
// a file this small as a data: URL
import viewerJsUrl from './document-viewer.js?url&no-inline';

const VIEWER_CSS = /* css */ `
  /** @warning no min-height here: it would keep the measured height from shrinking back with the frame */
  html { overflow-x: hidden; }
  body { background: var(--background-alt-grey); margin: 0; }
  .pagedjs_pages { display: flex; flex-direction: column; row-gap: 2rem; align-items: center; padding: 0; }
  .pagedjs_page { margin: 0; }
  .pagedjs_sheet { background: white; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
`;

/** Parsed, not string-replaced: a document without a head would silently render unstyled */
function prepareForViewer(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const viewer = doc.createElement('style');
  viewer.dataset.pagedjsIgnore = '';
  viewer.textContent = VIEWER_CSS;

  const script = doc.createElement('script');
  script.src = viewerJsUrl;

  // the documents frozen before paged.js left the templates still load it from unpkg
  doc.querySelectorAll('script[src*="paged"]').forEach((frozen) => frozen.remove());

  const paged = doc.createElement('script');
  paged.defer = true;
  paged.src = pagedJsUrl;

  doc.head.append(viewer, script, paged);

  return `<!doctype html>${doc.documentElement.outerHTML}`;
}

function editableContentOf(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.querySelector('[data-editable-content]')?.innerHTML ?? '';
}

export type DocumentViewerHandle = { updateContent: (html: string) => void };

export const DocumentViewer = forwardRef<
  DocumentViewerHandle,
  { className?: string; html: string; reloadKey?: string; title: string }
>(function DocumentViewer(props, ref) {
  const { formatMessage } = useIntl();

  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === 'CONTENT_HEIGHT' && typeof event.data.height === 'number') {
        setHeight(event.data.height);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useImperativeHandle(ref, () => ({
    updateContent: (html: string) =>
      frameRef.current?.contentWindow?.postMessage(
        { type: 'UPDATE_CONTENT', html: editableContentOf(html) },
        window.location.origin,
      ),
  }));

  const srcDoc = useMemo(() => prepareForViewer(props.html), [props.html]);

  return (
    <iframe
      className={props.className}
      key={props.reloadKey}
      ref={frameRef}
      src={window.location.origin}
      srcDoc={srcDoc}
      style={{ height }}
      title={formatMessage({ defaultMessage: 'Aperçu de {title}' }, { title: props.title })}
    />
  );
});
