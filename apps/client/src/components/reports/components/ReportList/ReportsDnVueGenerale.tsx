import type React from 'react';

import { NominationFilesTable } from '@/components/shared/nomination-files-table/NominationFilesTable';
import type { FormationEnum } from '@/types/enums.types';

import { TransparencyAttachmentsSection } from './TransparencyAttachmentsSection';

export const ReportsDnVueGenerale = (
  props: React.PropsWithChildren<{ sessionId: string; formation: FormationEnum }>,
) => {
  return (
    <div className="my-4 flex flex-col gap-4">
      <NominationFilesTable formation={props.formation} sessionId={props.sessionId!} isEditable={false}>
        {props.children}
      </NominationFilesTable>
      <TransparencyAttachmentsSection sessionId={props.sessionId} />
    </div>
  );
};
