import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import { useMemo, type CSSProperties } from 'react';

import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { sessionOutcomeLabel } from './nomination-file-outcome.utils';
import { NominationFileOutcomeBadge } from './NominationFileOutcomeBadge';

export function NominationFileOutcome(props: { nominationFile: SessionNominationFile }) {
  const { formation, outcomes } = useNominationFilesTable();
  const outcome = useMemo(() => props.nominationFile.content.outcome, [props]);

  if (!outcome) return '-';

  const label = sessionOutcomeLabel(outcomes, outcome.value);

  if (!outcome.comment) {
    return <NominationFileOutcomeBadge acronym formation={formation} label={label} outcome={outcome.value} />;
  }

  return (
    <Tooltip kind="hover" title={outcome.comment}>
      <div
        className="flex cursor-pointer flex-row items-center gap-1"
        style={{ '--icon-size': '10px' } as CSSProperties}
      >
        <NominationFileOutcomeBadge acronym formation={formation} label={label} outcome={outcome.value} />
        <i className="ri-message-3-line text-(--text-action-high-blue-france) before:size-5! before:content-['']" />
      </div>
    </Tooltip>
  );
}
