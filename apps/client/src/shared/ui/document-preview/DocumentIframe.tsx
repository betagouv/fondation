import React from 'react';
import { useIntl } from 'react-intl';

import fontsCss from './document-fonts.css?inline';

function extractEditableContent(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.querySelector('[data-editable-content]')?.innerHTML ?? '';
}

function prepareForViewer(html: string): string {
  return html.replace('<head>', `<head><style data-pagedjs-ignore>${fontsCss}</style>`).replace(
    '</head>',
    /* html */ `
      <style data-pagedjs-ignore>
        html, body { height: 100%; }
        html { overflow-x: hidden; }
        body { background: var(--background-alt-grey); margin: 0; }
        .pagedjs_pages { display: flex; flex-direction: column; row-gap: 2rem; align-items: center; padding: 50px 0; transform-origin: top center; }
        .pagedjs_page { margin: 0; }
        .pagedjs_sheet { background: white; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
      </style>
      <script>
        function after() {
          var pages = document.querySelector('.pagedjs_pages');
          var firstSheet = document.querySelector('.pagedjs_sheet');
          if (!pages || !firstSheet) return;

          function reportHeight() {
            window.parent.postMessage(
              { type: 'CONTENT_HEIGHT', height: document.documentElement.scrollHeight },
              '*',
            );
          }

          function resize() {
            var containerWidth = document.documentElement.clientWidth;
            var sheetWidth = firstSheet.offsetWidth;
            if (!sheetWidth) return;
            var scale = (containerWidth * 0.9) / sheetWidth;
            pages.style.transform = 'scale(' + scale + ')';
            pages.style.marginBottom = (pages.offsetHeight * (scale - 1)) + 'px';
            reportHeight();
          }

          resize();
          new ResizeObserver(resize).observe(document.documentElement);
          if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
        }

        window.addEventListener('message', async function(e) {
          if (e.data && e.data.type === 'UPDATE_CONTENT') {
            var node = document.querySelector('[data-editable-content]');
            if (node) node.innerHTML = e.data.html;
          }
        });

        window.PagedConfig = { after };
      </script>
    </head>`,
  );
}

export type DocumentIframeHandle = {
  updateContent: (html: string) => void;
};

export const DocumentIframe = React.forwardRef<
  DocumentIframeHandle,
  { html: string; title: string; reloadKey?: string; className?: string; autoHeight?: boolean }
>(function DocumentIframe(props, ref) {
  const { $t } = useIntl();

  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = React.useState<number>();

  React.useEffect(() => {
    if (!props.autoHeight) return;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type === 'CONTENT_HEIGHT' && typeof event.data.height === 'number') {
        setHeight(event.data.height);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [props.autoHeight]);

  React.useImperativeHandle(
    ref,
    () => ({
      updateContent: (html: string) => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'UPDATE_CONTENT', html: extractEditableContent(html) },
          window.location.origin,
        );
      },
    }),
    [],
  );

  return (
    <iframe
      key={props.reloadKey}
      ref={iframeRef}
      className={props.className}
      style={props.autoHeight ? { height } : undefined}
      src={window.location.origin}
      srcDoc={prepareForViewer(props.html)}
      title={$t({ defaultMessage: 'Aperçu de {title}' }, { title: props.title })}
    ></iframe>
  );
});
