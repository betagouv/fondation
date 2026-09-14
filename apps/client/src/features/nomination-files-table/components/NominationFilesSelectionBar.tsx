import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage } from 'react-intl';

import { NominationFilesSelectionModeButton } from './NominationFilesSelectionModeButton';

export function NominationFilesSelectionBar(props: {
  onClear: () => void;
  onExit: () => void;
  selectedCount: number;
  totalCount: number;
}) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-4">
      <p
        aria-live="polite"
        className="fr-px-4v fr-m-0 flex min-h-10 items-center bg-(--background-alt-blue-france) text-sm font-medium"
      >
        <FormattedMessage
          defaultMessage={`{count, plural,
            =0 {Aucune proposition sélectionnée}
            one {1 proposition sélectionnée}
            other {{count, number} propositions sélectionnées}} sur {total, number}`}
          values={{ count: props.selectedCount, total: props.totalCount }}
        />
      </p>

      <div className="flex items-center gap-2">
        {props.selectedCount > 0 && (
          <Button className="py-2!" onClick={props.onClear} priority="tertiary no outline" size="small">
            <FormattedMessage defaultMessage="Tout désélectionner" />
          </Button>
        )}
        <NominationFilesSelectionModeButton isSelecting onToggle={props.onExit} />
      </div>
    </div>
  );
}
