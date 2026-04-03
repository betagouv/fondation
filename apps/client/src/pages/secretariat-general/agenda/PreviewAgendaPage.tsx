import clsx from 'clsx';
import { generatePath, useNavigate, useParams } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import Button from '@codegouvfr/react-dsfr/Button';
import { useAgendaHtmlQuery, useGenerateAgendaPdfMutation } from '@queries/agenda.queries';

import { PageContentLayout } from '@/components/shared/PageContentLayout';
import fontsCss from './PreviewAgendaPage.css?inline';

function injectFonts(html: string): string {
  return html.replace('<head>', `<head><style data-pagedjs-ignore>${fontsCss}</style>`).replace(
    `</head>`,
    `<style>
        .pagedjs_page { margin: 12px; }
      </style>
    </head>`
  );
}

export function PreviewAgendaPage() {
  const { agendaId, sessionId } = useParams<{ agendaId: string; sessionId: string }>();
  const navigate = useNavigate();

  const { data: html, isPending } = useAgendaHtmlQuery({ id: agendaId, force: true });
  const generatePdf = useGenerateAgendaPdfMutation();

  return (
    <PageContentLayout>
      <div className="mx-auto max-w-3xl pb-12 pt-4">
        <h1>Ordre du jour</h1>
        <div className="mx-auto mb-0 mt-6 flex aspect-[1/4.414] max-h-screen w-[calc(21cm+1rem)] flex-col">
          {isPending || !html ? (
            <i className="ri-loader-4-line m-auto animate-spin text-[2rem]" />
          ) : (
            <iframe
              className="flex-1 border border-solid border-gray-100"
              style={{ flex: 1 }}
              src={window.location.origin}
              srcDoc={injectFonts(html)}
              title="Aperçu de l'ordre du jour"
            />
          )}

          <div className="sticky bottom-0 flex justify-center overflow-y-scroll bg-white px-4 py-6">
            <Button
              disabled={generatePdf.isPending}
              iconId={generatePdf.isPending ? 'ri-loader-4-line' : 'fr-icon-success-fill'}
              iconPosition="right"
              className={clsx({
                'after:size-5 after:animate-spin after:content-[""]': generatePdf.isPending
              })}
              onClick={() =>
                generatePdf.mutate(
                  { sessionId: sessionId!, agendaId: agendaId! },
                  {
                    onSuccess: () =>
                      navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: sessionId! }))
                  }
                )
              }
            >
              Valider le document
            </Button>
          </div>
        </div>
      </div>
    </PageContentLayout>
  );
}
