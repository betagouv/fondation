import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

import { Tooltip } from '@/shared/ui/tooltip';

export function NominationFilesSelectionModeButton(props: { isSelecting: boolean; onToggle: () => void }) {
  const { formatMessage } = useIntl();
  const label = props.isSelecting
    ? formatMessage({ defaultMessage: 'Quitter la sélection' })
    : formatMessage({ defaultMessage: 'Sélectionner des propositions' });

  return (
    <Tooltip label={label}>
      <button
        aria-label={label}
        className={clsx(
          cx('fr-btn', 'fr-btn--tertiary', 'fr-btn--sm'),
          props.isSelecting ? 'fr-icon-close-line' : 'fr-icon-edit-fill',
          'h-10! max-h-10! w-10! max-w-10! justify-center before:mr-0! before:[--icon-size:1.25rem]!',
        )}
        onClick={props.onToggle}
        type="button"
      />
    </Tooltip>
  );
}
