import { FormationEnum, type NominationFileOutcomeEnum } from '@/types/enums.types';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import { NominationFileOutcomeShortBadge } from './NominationFileOutcomeBadge';

export function NominationFileOutcome(props: {
  formation: FormationEnum;
  outcome: { value: NominationFileOutcomeEnum; comment: string | null } | null;
}) {
  if (!props.outcome) return '-';

  if (!props.outcome.comment) {
    return <NominationFileOutcomeShortBadge formation={props.formation} outcome={props.outcome.value} />;
  }

  return (
    <Tooltip kind="hover" title={props.outcome.comment}>
      <div
        className="flex cursor-pointer flex-row items-center gap-1"
        style={{ '--icon-size': '10px' } as React.CSSProperties}
      >
        <NominationFileOutcomeShortBadge formation={props.formation} outcome={props.outcome.value} />
        <i className="ri-message-3-line text-[color:var(--text-action-high-blue-france)] before:size-5 before:content-['']" />
      </div>
    </Tooltip>
  );
}
