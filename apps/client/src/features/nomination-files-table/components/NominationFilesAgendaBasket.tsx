import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';

import type { AgendaBasket } from '@/features/agenda/hooks/useAgendaBasket.hook';

export function NominationFilesAgendaBasket(props: {
  basket: AgendaBasket;
  isFiltering: boolean;
  onToggleFilter: () => void;
}) {
  if (props.basket.isEmpty) return null;

  return (
    <div
      className={clsx(
        'flex w-fit items-center rounded-full transition-colors duration-200',
        props.isFiltering
          ? 'bg-(--background-action-low-blue-france-active)'
          : 'bg-(--background-action-low-blue-france)',
      )}
    >
      <Button
        className="rounded-full text-(--text-action-high-blue-france) hover:bg-transparent"
        nativeButtonProps={{ 'aria-pressed': props.isFiltering }}
        onClick={props.onToggleFilter}
        priority="tertiary no outline"
        size="small"
        type="button"
      >
        <span>
          <FormattedMessage defaultMessage="ODJ en préparation" />
          <span className="fr-ml-1v text-xs">({props.basket.size})</span>
        </span>
      </Button>
    </div>
  );
}
