import { colors } from '@codegouvfr/react-dsfr';
import Button from '@codegouvfr/react-dsfr/Button';
import { useIntl } from 'react-intl';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { GradeAndPosition } from '@/shared/components/GradeAndPosition';
import { Tooltip } from '@/shared/ui/tooltip';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { useNominationFileTargetPositionModal } from './NominationFileTargetPositionContext';

const alertColor = colors.decisions.text.default.warning.default;

export function NominationFileTargetPositionCell(props: { nominationFile: SessionNominationFile }) {
  const { formatMessage } = useIntl();
  const { open } = useNominationFileTargetPositionModal();
  const isSg = useIsSgNavigation();

  const label = (
    <span className="leading-6">
      <GradeAndPosition
        grade={props.nominationFile.content.gradeCible}
        position={props.nominationFile.content.posteCible}
      />
    </span>
  );

  if (!isSg || !props.nominationFile.jurisdictionSheetRequired) return label;

  return (
    <Tooltip label={formatMessage({ defaultMessage: 'Fiche de juridiction requise' })}>
      <Button
        className="group fr-px-0"
        onClick={() => open(props.nominationFile)}
        priority="tertiary no outline"
        size="small"
      >
        <span className="text-left text-sm font-normal">
          <span
            className="bg-[linear-gradient(currentColor,currentColor)] bg-size-[100%_1px] bg-position-[0_calc(100%-2px)] bg-no-repeat group-hover:bg-size-[100%_2px]"
            style={{ color: alertColor }}
          >
            <i className="fr-icon-error-warning-line fr-mr-1v relative -top-0.5 inline-block align-middle before:block before:size-3.5! before:content-['']" />
            {label}
          </span>
        </span>
      </Button>
    </Tooltip>
  );
}
