import { colors } from '@codegouvfr/react-dsfr';
import Button from '@codegouvfr/react-dsfr/Button';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import clsx from 'clsx';
import React from 'react';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { unaccent } from '@/utils/string.utils';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { NominationFileTargetPositionContext } from './NominationFileTargetPositionContext';
import { nominationFileTargetPositionModal } from './NominationFileTargetPositionProvider';

function normalizePosition(position: string | undefined | null): string {
  const trimmed = position?.trim();
  if (!trimmed) return '';

  return unaccent(trimmed).toLowerCase();
}

const HEARING_ALERT_POSITIONS = ['Procureur Général', 'Procureur de la République'].map(
  (x) => new RegExp(`^${normalizePosition(x)} (?!\\s*adjoint)`, 'i'),
);

function useHearingAlertTargetedPosition(nominationFile: SessionNominationFile): {
  position: string;
  hasAlert: boolean;
} {
  const isSg = useIsSg();
  const [position, normalizedPosition, isAlertHidden] = React.useMemo(() => {
    const target = nominationFile.content.posteCible;

    return [target, normalizePosition(target), nominationFile.content.isAlertHidden] as const;
  }, [nominationFile]);

  if (!position) return { position: '', hasAlert: false };

  return {
    position,
    hasAlert: isSg && !isAlertHidden && HEARING_ALERT_POSITIONS.some((x) => x.test(normalizedPosition)),
  };
}

export function NominationFileTargetPositionCell(props: { nominationFile: SessionNominationFile }) {
  const { setNominationFile } = React.useContext(NominationFileTargetPositionContext);
  const { hasAlert, position } = useHearingAlertTargetedPosition(props.nominationFile);

  const onClick = React.useCallback(() => {
    setNominationFile(props.nominationFile);
    nominationFileTargetPositionModal.open();
  }, [props.nominationFile, setNominationFile]);

  if (!hasAlert) return position;

  return (
    /** @warning ".position-hearing-alert" is used by {@link NominationFilesTable.css} */
    <Tooltip title="Fiche de juridiction requise">
      <Button
        size="small"
        className="position-hearing-alert fr-px-0 hover:underline"
        aria-controls={nominationFileTargetPositionModal.id}
        onClick={onClick}
        priority="tertiary no outline"
      >
        <i
          style={{
            color: colors.decisions.text.default.warning.default,
          }}
          className={clsx(
            cx('fr-icon-warning-fill'),
            'text-center',
            'block',
            'rounded-full',
            'fr-p-1v',
            'size-6',

            'before:block',
            'before:content-[""]',
            'before:size-4!',
          )}
        />
        <span
          className="text-left text-sm font-normal"
          style={{ color: colors.decisions.text.default.grey.default }}
        >
          {position}
        </span>
      </Button>
    </Tooltip>
  );
}
