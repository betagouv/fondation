import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import React from 'react';

import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { NominationFileOutcomeBadge } from './NominationFileOutcomeBadge';

export function NominationFileOutcome(props: { nominationFile: SessionNominationFile }) {
  const { formation } = useNominationFilesTable();
  const outcome = React.useMemo(() => props.nominationFile.content.outcome, [props]);

  if (!outcome) return '-';

  if (!outcome.comment) {
    return <NominationFileOutcomeBadge short formation={formation} outcome={outcome.value} />;
  }

  return (
    <Tooltip kind="hover" title={outcome.comment}>
      <div
        className="flex cursor-pointer flex-row items-center gap-1"
        style={{ '--icon-size': '10px' } as React.CSSProperties}
      >
        <NominationFileOutcomeBadge short formation={formation} outcome={outcome.value} />
        <i className="ri-message-3-line text-(--text-action-high-blue-france) before:size-5! before:content-['']" />
      </div>
    </Tooltip>
  );
}
