import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

const VIEWER_CSS = /* css */ `
  html, body { min-height: 100%; }
  html { overflow-x: hidden; }
  body { background: var(--background-alt-grey); margin: 0; }
  .pagedjs_pages { display: flex; flex-direction: column; row-gap: 2rem; align-items: center; padding: 50px 0; }
  .pagedjs_page { margin: 0; }
  .pagedjs_sheet { background: white; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
`;

const VIEWER_JS = /* js */ `
  function reportHeight() {
    parent.postMessage({ type: 'CONTENT_HEIGHT', height: document.documentElement.scrollHeight }, '*');
  }

  function observeHeight() {
    new ResizeObserver(reportHeight).observe(document.documentElement);
    reportHeight();
  }

  // reporting before paged.js paginates would size the frame on the unpaginated column, then shrink it
  if (document.querySelector('script[src*="paged"]')) {
    setTimeout(function () {
      if (!document.querySelector('.pagedjs_pages')) observeHeight();
    }, 3000);
  } else {
    addEventListener('load', observeHeight);
  }

  function after() {
    var pages = document.querySelector('.pagedjs_pages');
    var firstSheet = document.querySelector('.pagedjs_sheet');
    if (!pages || !firstSheet) return;

    // zoom takes part in layout, where a scale transform stays invisible to the flow
    function resize() {
      pages.style.zoom = '';
      var sheetWidth = firstSheet.offsetWidth;
      if (!sheetWidth) return;
      pages.style.zoom = (document.documentElement.clientWidth * 0.9) / sheetWidth;
      reportHeight();
    }

    resize();
    new ResizeObserver(resize).observe(document.documentElement);
    if (document.fonts) document.fonts.ready.then(resize);
  }

  // only the window that embedded us may rewrite the document, never a page embedding the app
  addEventListener('message', function (event) {
    if (event.source !== parent) return;
    if (event.data && event.data.type === 'UPDATE_CONTENT') {
      var node = document.querySelector('[data-editable-content]');
      if (node) node.innerHTML = event.data.html;
    }
  });

  window.PagedConfig = { after };
`;

/** Parsed, not string-replaced: a document without a head would silently render unstyled */
function prepareForViewer(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const viewer = doc.createElement('style');
  viewer.dataset.pagedjsIgnore = '';
  viewer.textContent = VIEWER_CSS;

  const script = doc.createElement('script');
  script.textContent = VIEWER_JS;

  doc.head.append(viewer, script);

  return `<!doctype html>${doc.documentElement.outerHTML}`;
}

function editableContentOf(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.querySelector('[data-editable-content]')?.innerHTML ?? '';
}

export type DocumentViewerHandle = { updateContent: (html: string) => void };

export const DocumentViewer = forwardRef<
  DocumentViewerHandle,
  { className?: string; fillHeight?: boolean; html: string; reloadKey?: string; title: string }
>(function DocumentViewer(props, ref) {
  const { $t } = useIntl();

  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    if (props.fillHeight) return;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === 'CONTENT_HEIGHT' && typeof event.data.height === 'number') {
        setHeight(event.data.height);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [props.fillHeight]);

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
      key={props.reloadKey}
      ref={frameRef}
      className={props.className}
      src={window.location.origin}
      srcDoc={srcDoc}
      style={props.fillHeight ? undefined : { height }}
      title={$t({ defaultMessage: 'Aperçu de {title}' }, { title: props.title })}
    />
  );
});
