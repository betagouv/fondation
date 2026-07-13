import type { PropsWithChildren } from 'react';

import { NominationFilesTable } from '@/features/nomination-files-table/components/NominationFilesTable';
import type { SessionOutcome } from '@/features/nomination-files-table/context/files-table.context';
import type { FormationEnum } from '@/types/enums.types';

import { TransparencyAttachmentsSection } from './TransparencyAttachmentsSection';

export const ReportsDnVueGenerale = (
  props: PropsWithChildren<{
    formation: FormationEnum;
    outcomes: readonly SessionOutcome[];
    sessionId: string;
  }>,
) => {
  return (
    <div className="fr-my-4v flex flex-col gap-4">
      <NominationFilesTable
        formation={props.formation}
        isEditable={false}
        outcomes={props.outcomes}
        sessionId={props.sessionId!}
      >
        {props.children}
      </NominationFilesTable>
      <TransparencyAttachmentsSection sessionId={props.sessionId} />
    </div>
  );
};
