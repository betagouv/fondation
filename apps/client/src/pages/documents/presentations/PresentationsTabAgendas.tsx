import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';

import { PresentationAgendaSelectionTable } from '@/features/documents/components/presentations/PresentationAgendaSelectionTable';
import { useListPresentationPlansAgendasQuery } from '@queries/agenda.queries';

export function PresentationsTabAgendas() {
  const { data: agendas, isPending } = useListPresentationPlansAgendasQuery();

  if (isPending) {
    return (
      <div className="fr-container">
        <p
          className={clsx(
            'text-md text-center text-(--text-mention-grey) before:animate-spin before:content-[""]',
            cx('ri-loader-4-line'),
          )}
        >
          <FormattedMessage defaultMessage="Chargement..." />
        </p>
      </div>
    );
  }

  return <PresentationAgendaSelectionTable items={agendas?.items} />;
}
