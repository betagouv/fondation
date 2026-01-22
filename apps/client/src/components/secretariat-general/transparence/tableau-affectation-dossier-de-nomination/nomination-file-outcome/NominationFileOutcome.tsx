import React from 'react';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import { NominationFileOutcomeShortBadge } from './NominationFileOutcomeBadge';
import { useNominationFilesTable } from '@/components/shared/nomination-files-table/components/NominationFilesTableContext';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export function NominationFileOutcome(props: { nominationFile: SessionNominationFile }) {
  const { formation } = useNominationFilesTable();
  const outcome = React.useMemo(() => props.nominationFile.content.outcome, [props]);

  if (!outcome) return '-';

  if (!outcome.comment) {
    return <NominationFileOutcomeShortBadge formation={formation} outcome={outcome.value} />;
  }

  return (
    <Tooltip kind="hover" title={outcome.comment}>
      <div
        className="flex cursor-pointer flex-row items-center gap-1"
        style={{ '--icon-size': '10px' } as React.CSSProperties}
      >
        <NominationFileOutcomeShortBadge formation={formation} outcome={outcome.value} />
        <i className="ri-message-3-line text-[color:var(--text-action-high-blue-france)] before:size-5 before:content-['']" />
      </div>
    </Tooltip>
  );
}
