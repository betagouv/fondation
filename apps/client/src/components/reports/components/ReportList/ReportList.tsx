import type { RowData, Table } from '@tanstack/react-table';

import { NominationSessionAttachmentList } from '../../../shared/NominationSessionAttachmentList';
import { DataTable } from '@/components/shared/data-table';
import { useListNominationSessionAttachmentsQuery } from '@queries/nomination-sessions.queries';

export function ReportList<Data extends RowData>(
  props: React.PropsWithChildren<{ sessionId: string; table: Table<Data> }>,
) {
  const { data: attachments } = useListNominationSessionAttachmentsQuery({
    sessionId: props.sessionId,
  });

  return (
    <div className="mb-4 mt-12 flex flex-col gap-4">
      <DataTable table={props.table} placeholder={`Aucun résultat ne correspond aux valeurs filtrées`}>
        {props.children}
      </DataTable>

      {Boolean(attachments?.items.length) && (
        <div>
          <h2>Pièces jointes</h2>
          <NominationSessionAttachmentList sessionId={props.sessionId} />
        </div>
      )}
    </div>
  );
}
export default ReportList;
