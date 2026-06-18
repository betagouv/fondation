import type React from 'react';

import { NominationFilesTable } from '@/features/nomination-files-table/components/NominationFilesTable';
import type { FormationEnum } from '@/types/enums.types';

import { TransparencyAttachmentsSection } from './TransparencyAttachmentsSection';

export const ReportsDnVueGenerale = (
  props: React.PropsWithChildren<{ sessionId: string; formation: FormationEnum }>,
) => {
  return (
    <div className="fr-my-4v flex flex-col gap-4">
      <NominationFilesTable formation={props.formation} sessionId={props.sessionId!} isEditable={false}>
        {props.children}
      </NominationFilesTable>
      <TransparencyAttachmentsSection sessionId={props.sessionId} />
    </div>
  );
};
