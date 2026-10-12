import { useMemo, type CSSProperties } from 'react';

import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import { OutcomeBadge } from '@/shared/components/outcome-badge';
import { Tooltip } from '@/shared/ui/tooltip';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { sessionOutcomeLabel } from './nomination-file-outcome.utils';

export function NominationFileOutcome(props: { nominationFile: SessionNominationFile }) {
  const { formation, outcomes } = useNominationFilesTable();
  const outcome = useMemo(() => props.nominationFile.content.outcome, [props]);

  if (!outcome) return '-';

  const label = sessionOutcomeLabel(outcomes, outcome.value);

  if (!outcome.comment) {
    return <OutcomeBadge acronym formation={formation} label={label} outcome={outcome.value} />;
  }

  return (
    <Tooltip label={outcome.comment}>
      <div className="flex items-center gap-1" style={{ '--icon-size': '10px' } as CSSProperties}>
        <OutcomeBadge acronym formation={formation} label={label} outcome={outcome.value} />
        <i className="ri-message-3-line fr-icon--sm text-(--text-action-high-blue-france)" />
      </div>
    </Tooltip>
  );
}
