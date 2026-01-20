import { useFormattedReportList } from '../../../../utils/format-report-list.utils';
import { useListNominationSessionAttachmentsQuery } from '@queries/nomination-sessions.queries';

import { ReportsTable } from './ReportsTable';
import { NominationSessionAttachmentList } from '../../../shared/NominationSessionAttachmentList';
import type { DetailedMemberSessionDto } from '@api/types';

export function ReportList(
  props: React.PropsWithChildren<{ sessionId: string; reports: DetailedMemberSessionDto['data']['reports'] }>
) {
  const { reports, headers } = useFormattedReportList(props.reports);
  const { data: attachments } = useListNominationSessionAttachmentsQuery({
    sessionId: props.sessionId
  });

  return (
    <div className="my-4 flex flex-col gap-4">
      <ReportsTable headers={headers} reports={reports} sessionId={props.sessionId}>
        {props.children}
      </ReportsTable>

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
