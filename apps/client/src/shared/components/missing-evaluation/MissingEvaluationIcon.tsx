import clsx from 'clsx';
import { useIntl } from 'react-intl';

import { Tooltip } from '@/shared/ui/tooltip';

export function MissingEvaluationIcon(props: { className?: string }) {
  const { formatMessage } = useIntl();

  const label = formatMessage({
    defaultMessage: 'Évaluation manquante dans le dossier administratif LOLFI',
  });

  return (
    <Tooltip label={label}>
      <i
        aria-label={label}
        className={clsx(
          'fr-icon-draft-line fr-icon--sm text-(--text-action-high-blue-france)',
          props.className,
        )}
        role="img"
      />
    </Tooltip>
  );
}
