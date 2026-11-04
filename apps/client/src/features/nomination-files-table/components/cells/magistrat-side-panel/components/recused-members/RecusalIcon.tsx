import { useIntl } from 'react-intl';

import { Tooltip } from '@/shared/ui/tooltip';

export function RecusalIcon() {
  const label = useRecusalLabel();

  return (
    <Tooltip label={label}>
      <i
        aria-label={label}
        className="fr-icon-error-line fr-icon--sm shrink-0 align-middle text-(--text-default-warning)"
        role="img"
      />
    </Tooltip>
  );
}

export function useRecusalLabel() {
  return useIntl().formatMessage({ defaultMessage: 'Déport sur ce dossier' });
}
