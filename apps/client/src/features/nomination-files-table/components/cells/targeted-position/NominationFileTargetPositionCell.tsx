import { colors } from '@codegouvfr/react-dsfr';
import Button from '@codegouvfr/react-dsfr/Button';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import { useCallback, useContext } from 'react';
import { useIntl } from 'react-intl';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { GradeAndPosition } from '@/shared/components/GradeAndPosition';
import { unaccent } from '@/utils/string.utils';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { NominationFileTargetPositionContext } from './NominationFileTargetPositionContext';
import { nominationFileTargetPositionModal } from './NominationFileTargetPositionProvider';

const alertColor = colors.decisions.text.default.warning.default;

function normalizePosition(position: string | undefined | null): string {
  const trimmed = position?.trim();
  if (!trimmed) return '';

  return unaccent(trimmed).toLowerCase();
}

const HEARING_ALERT_POSITIONS = ['Procureur Général', 'Procureur de la République'].map(
  (x) => new RegExp(`^${normalizePosition(x)} (?!\\s*adjoint)`, 'i'),
);

function useHearingAlert(nominationFile: SessionNominationFile): boolean {
  const isSg = useIsSg();
  const { isAlertHidden, posteCible } = nominationFile.content;

  if (!isSg || isAlertHidden || !posteCible) return false;

  return HEARING_ALERT_POSITIONS.some((x) => x.test(normalizePosition(posteCible)));
}

export function NominationFileTargetPositionCell(props: { nominationFile: SessionNominationFile }) {
  const { formatMessage } = useIntl();
  const { setNominationFile } = useContext(NominationFileTargetPositionContext);
  const hasAlert = useHearingAlert(props.nominationFile);

  const onClick = useCallback(() => {
    setNominationFile(props.nominationFile);
    nominationFileTargetPositionModal.open();
  }, [props.nominationFile, setNominationFile]);

  const label = (
    <span className="leading-6">
      <GradeAndPosition
        grade={props.nominationFile.content.gradeCible}
        position={props.nominationFile.content.posteCible}
      />
    </span>
  );

  if (!hasAlert) return label;

  return (
    <Tooltip title={formatMessage({ defaultMessage: 'Fiche de juridiction requise' })}>
      <Button
        aria-controls={nominationFileTargetPositionModal.id}
        className="group fr-px-0"
        onClick={onClick}
        priority="tertiary no outline"
        size="small"
      >
        <span className="text-left text-sm font-normal whitespace-nowrap">
          <span
            className="whitespace-normal underline underline-offset-4 group-hover:decoration-2"
            style={{ color: alertColor }}
          >
            {label}
          </span>
          <i
            className="fr-icon-warning-fill fr-ml-1v relative -top-px inline-block align-middle before:block before:size-4! before:content-['']"
            style={{ color: alertColor }}
          />
        </span>
      </Button>
    </Tooltip>
  );
}
