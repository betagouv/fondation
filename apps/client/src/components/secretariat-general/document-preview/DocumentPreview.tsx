import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';

import { PageContentLayout } from '@/components/shared/PageContentLayout';

import fontsCss from './document-fonts.css?inline';

export function injectFonts(html: string): string {
  return html.replace('<head>', `<head><style data-pagedjs-ignore>${fontsCss}</style>`).replace(
    `</head>`,
    `<style>
        .pagedjs_page { margin: 12px; }
      </style>
    </head>`,
  );
}

export function DocumentPreviewLayout(props: {
  title: string;
  html: string | undefined | null;
  isPending: boolean;
  isValidating: boolean;
  onValidate: () => unknown;
}) {
  const { title, html, isPending, isValidating, onValidate } = props;
  const { $t } = useIntl();

  const iframeTitle = $t({ defaultMessage: `Aperçu de {title}` }, { title });

  return (
    <PageContentLayout>
      <div className="mx-auto max-w-3xl pt-4 pb-12">
        <h1>{title}</h1>
        <div className="mx-auto mt-6 mb-0 flex aspect-[1/4.414] max-h-screen w-[calc(793.7007874015748px+1rem)] flex-col">
          {isPending || !html ? (
            <i className="ri-loader-4-line m-auto animate-spin text-[2rem]" />
          ) : (
            <iframe
              className="flex-1 border border-solid border-gray-100"
              style={{ flex: 1 }}
              src={window.location.origin}
              srcDoc={injectFonts(html)}
              title={iframeTitle}
            />
          )}

          <div className="sticky bottom-0 flex justify-center overflow-y-scroll bg-white px-4 py-6">
            <Button
              disabled={isValidating}
              iconId={isValidating ? 'ri-loader-4-line' : 'fr-icon-success-fill'}
              iconPosition="right"
              className={clsx({
                'after:size-5 after:animate-spin after:content-[""]': isValidating,
              })}
              onClick={onValidate}
            >
              <FormattedMessage defaultMessage={`Valider le document`} />
            </Button>
          </div>
        </div>
      </div>
    </PageContentLayout>
  );
}
