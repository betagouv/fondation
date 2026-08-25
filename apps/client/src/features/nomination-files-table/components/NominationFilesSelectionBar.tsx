import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useNominationFilesTable } from '../context/files-table.context';
import type { AgendaBasket } from '@/features/agenda/hooks/useAgendaBasket.hook';
import { Tooltip } from '@/shared/ui/tooltip';
import { useIsSessionReadyForDocGenerationQuery } from '@queries/agenda.queries';

import { NominationFilesSelectionModeButton } from './NominationFilesSelectionModeButton';

function AddToAgendaButton(props: {
  disabled: boolean;
  onClick: () => void;
  unavailableReason: string | null;
}) {
  const button = (
    <Button
      className="py-2! aria-disabled:cursor-not-allowed aria-disabled:bg-(--background-disabled-grey) aria-disabled:text-(--text-disabled-grey)"
      disabled={props.disabled}
      iconId="fr-icon-file-add-line"
      nativeButtonProps={props.unavailableReason ? { 'aria-disabled': true } : undefined}
      onClick={props.unavailableReason ? undefined : props.onClick}
      priority="primary"
      size="small"
    >
      <FormattedMessage defaultMessage="Ajouter à l'ODJ" />
    </Button>
  );

  if (!props.unavailableReason) return button;

  return <Tooltip label={props.unavailableReason}>{button}</Tooltip>;
}

export function NominationFilesSelectionBar(props: {
  basket: AgendaBasket;
  isFilteringBasket: boolean;
  onClear: () => void;
  onExit: () => void;
  selectedFileIds: readonly string[];
}) {
  const { basket, isFilteringBasket, onClear, onExit, selectedFileIds } = props;
  const { formatMessage } = useIntl();
  const { sessionId } = useNominationFilesTable();
  const { data: readiness } = useIsSessionReadyForDocGenerationQuery({ sessionId });

  const count = selectedFileIds.length;
  const cannotAddReason = readiness?.canCreateAgenda
    ? null
    : formatMessage({ defaultMessage: "Aucun dossier n'est disponible pour un ordre du jour" });

  const onAddToAgenda = useCallback(() => {
    basket.add(selectedFileIds);
    onExit();
  }, [basket, onExit, selectedFileIds]);

  const onRemoveFromAgenda = useCallback(() => {
    basket.remove(selectedFileIds);
    onExit();
  }, [basket, onExit, selectedFileIds]);

  return (
    <div className="fr-pl-4v flex min-h-10 items-center justify-between gap-4 bg-(--background-alt-blue-france)">
      <p aria-live="polite" className="fr-m-0 text-sm font-medium">
        <FormattedMessage
          defaultMessage={`{count, plural,
            =0 {Aucune proposition sélectionnée}
            one {1 proposition sélectionnée}
            other {{count, number} propositions sélectionnées}}`}
          values={{ count }}
        />
      </p>

      <div className="flex items-center gap-2">
        {count > 0 && (
          <Button className="py-2!" onClick={onClear} priority="tertiary no outline" size="small">
            <FormattedMessage defaultMessage="Tout désélectionner" />
          </Button>
        )}
        {isFilteringBasket ? (
          <Button
            className="py-2!"
            disabled={count === 0}
            iconId="ri-file-reduce-line"
            onClick={onRemoveFromAgenda}
            priority="primary"
            size="small"
          >
            <FormattedMessage defaultMessage="Retirer de l'ODJ" />
          </Button>
        ) : (
          <AddToAgendaButton
            disabled={count === 0}
            onClick={onAddToAgenda}
            unavailableReason={cannotAddReason}
          />
        )}
        <NominationFilesSelectionModeButton isSelecting onToggle={onExit} />
      </div>
    </div>
  );
}
