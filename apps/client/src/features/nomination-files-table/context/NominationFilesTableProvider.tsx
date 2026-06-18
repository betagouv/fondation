import React from 'react';

import type { FormationEnum } from '@/types/enums.types';

import { NominationFilesTableContext, type NominationFilesTableContextType } from './files-table.context';

export function NominationFilesTableProvider(
  props: React.PropsWithChildren<{
    sessionId: string;
    formation: FormationEnum;
    isEditable?: boolean;
  }>,
) {
  const [isEditing, setEditing] = React.useState<boolean>(false);
  const [totalRowsCount, setTotalRowsCount] = React.useState<number>(0);

  const ctx = React.useMemo(() => {
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    const ctxValue: any = {
      sessionId: props.sessionId,
      formation: props.formation,
      isEditable: props.isEditable !== false,
      totalRowsCount,
      setTotalRowsCount,
      edition: undefined,
    };

    if (props.isEditable !== false) {
      ctxValue.edition = { isEditing, setEditing };
    }

    return ctxValue as NominationFilesTableContextType;
  }, [props, isEditing, setEditing, totalRowsCount, setTotalRowsCount]);

  return <NominationFilesTableContext value={ctx}>{props.children}</NominationFilesTableContext>;
}
