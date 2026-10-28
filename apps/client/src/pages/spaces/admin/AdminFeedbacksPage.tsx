import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage, useIntl } from 'react-intl';

import { useExportFailure } from '@/features/nomination-files-table/hooks/useExportFailure';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { useListFeedbacksAsExcelMutation } from '@queries/feedback.queries';

export function AdminFeedbacksPage() {
  const { formatMessage } = useIntl();
  const exportAsExcel = useListFeedbacksAsExcelMutation();
  const onExportFailure = useExportFailure();

  return (
    <div className="fr-container fr-pt-8v fr-pb-16v">
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane pour l'Administration" })}
        breadcrumb={{
          currentPageLabel: formatMessage({ defaultMessage: 'Consulter les avis' }),
          segments: [{ label: formatMessage({ defaultMessage: 'Administration' }), to: {} }],
        }}
        id="administration-breadcrumb"
      />

      <h1 className="fr-h3 fr-mb-4v">
        <FormattedMessage defaultMessage="Consulter les avis" />
      </h1>
      <p className="fr-mb-6v max-w-3xl leading-7 text-(--text-mention-grey)">
        <FormattedMessage defaultMessage="Avis des membres et du secrétariat général, donnés depuis l'en-tête." />
      </p>

      <section className="fr-p-6v max-w-3xl border border-solid border-(--border-default-grey)">
        <div className="fr-mb-4v">
          <h2 className="fr-h6 fr-mb-1v flex items-center gap-2">
            <span aria-hidden className="fr-icon-file-download-line text-(--text-title-blue-france)" />
            <FormattedMessage defaultMessage="Export Excel" />
          </h2>
          <p className="fr-text--sm fr-mb-0 text-(--text-mention-grey)">
            <FormattedMessage defaultMessage="Une ligne par envoi, groupée par répondant (numéro anonyme). La dernière colonne liste les réponses modifiées depuis l'envoi précédent." />
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
