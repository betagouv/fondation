import { colors } from '@codegouvfr/react-dsfr';
import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback, useContext } from 'react';
import { useIntl } from 'react-intl';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { GradeAndPosition } from '@/shared/components/GradeAndPosition';
import { Tooltip } from '@/shared/ui/tooltip';
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
    <Tooltip label={formatMessage({ defaultMessage: 'Fiche de juridiction requise' })}>
      <Button
        aria-controls={nominationFileTargetPositionModal.id}
        className="group fr-px-0"
        onClick={onClick}
        priority="tertiary no outline"
        size="small"
      >
        <span className="text-left text-sm font-normal">
          <span
            className="bg-[linear-gradient(currentColor,currentColor)] bg-size-[100%_1px] bg-position-[0_calc(100%-2px)] bg-no-repeat group-hover:bg-size-[100%_2px]"
            style={{ color: alertColor }}
          >
            {label}
            <i className="fr-icon-warning-fill fr-ml-1v relative -top-0.5 inline-block align-middle before:block before:size-3.5! before:content-['']" />
          </span>
        </span>
      </Button>
    </Tooltip>
  );
}
