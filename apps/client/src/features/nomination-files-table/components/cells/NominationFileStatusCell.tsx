import { useIntl } from 'react-intl';

import { formatDateOnly } from '@/utils/date-only.util';
import type { SessionNominationFileStatus } from '@queries/nomination-sessions.queries';

export function NominationFileStatusCell(props: { status: SessionNominationFileStatus }) {
  const { formatMessage } = useIntl();

  if (props.status.value === 'TO_REPORT') {
    return <span className="block text-center">{formatMessage({ defaultMessage: 'En attente' })}</span>;
  }

  const [latestDate] = props.status.dates;

  const doc =
    props.status.value === 'DSJ_PLANNED'
      ? { acronym: 'ODJ', label: formatMessage({ defaultMessage: 'Ordre du jour' }) }
      : { acronym: 'PV', label: formatMessage({ defaultMessage: 'PV de restitution' }) };

  return (
    <span className="flex flex-col items-center">
      <span>
        <i
          aria-hidden
          className="fr-icon-file-text-line fr-mr-1v relative -top-0.5 inline-block align-middle before:block before:size-3.5! before:content-['']"
        />
        <abbr aria-hidden className="no-underline" title={doc.label}>
          {doc.acronym}
        </abbr>
        <span className="fr-sr-only">{doc.label}</span>
      </span>

      {latestDate && <span className="text-xs text-(--text-mention-grey)">{formatDateOnly(latestDate)}</span>}
    </span>
  );
}
