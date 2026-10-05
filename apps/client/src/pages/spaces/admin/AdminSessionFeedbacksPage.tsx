import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage } from 'react-intl';

import { useExportFailure } from '@/features/nomination-files-table/hooks/useExportFailure';
import { useListSessionFeedbacksAsExcelMutation } from '@queries/feedback.queries';

export function AdminSessionFeedbacksPage() {
  const exportAsExcel = useListSessionFeedbacksAsExcelMutation();
  const onExportFailure = useExportFailure();

  return (
    <div className="fr-container fr-py-8v">
      <h1 className="fr-h3 fr-mb-2v">
        <FormattedMessage defaultMessage="Avis des utilisateurs" />
      </h1>
      <p className="fr-mb-6v max-w-3xl leading-7 text-(--text-mention-grey)">
        <FormattedMessage defaultMessage="Les membres et le secrétariat général donnent leur avis depuis la page de chaque session." />
      </p>

      <section className="fr-p-6v max-w-3xl border border-solid border-(--border-default-grey)">
        <div className="fr-mb-4v">
          <h2 className="fr-h6 fr-mb-1v flex items-center gap-2">
            <span aria-hidden className="fr-icon-file-download-line text-(--text-title-blue-france)" />
            <FormattedMessage defaultMessage="Export Excel" />
          </h2>
          <p className="fr-text--sm fr-mb-0 text-(--text-mention-grey)">
            <FormattedMessage defaultMessage="Le fichier rassemble les réponses de toutes les sessions, à raison d'une ligne par réponse. Il précise la session, la date de réponse, les notes et les commentaires, sans jamais mentionner le nom de la personne." />
          </p>
        </div>
        <Button
          disabled={exportAsExcel.isPending}
          iconId="fr-icon-download-line"
          onClick={() => exportAsExcel.mutate(undefined, { onError: onExportFailure })}
        >
          <FormattedMessage defaultMessage="Télécharger" />
        </Button>
      </section>
    </div>
  );
}
