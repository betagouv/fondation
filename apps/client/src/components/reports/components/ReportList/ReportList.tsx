import { useFormattedReportList } from '../../../../utils/format-report-list.utils';
import type { DetailedSessionReport } from '../../../../react-query/queries/members/sessions.queries';
import { useListNominationSessionAttachmentsQuery } from '../../../../react-query/mutations/sg/nomination-sessions';

import { ReportsTable } from './ReportsTable';
import { NominationSessionAttachmentList } from '../../../shared/NominationSessionAttachmentList';

export function ReportList(
  props: React.PropsWithChildren<{ sessionId: string; reports: DetailedSessionReport[] }>
) {
  const { reports, headers } = useFormattedReportList(props.reports);
  const { data: attachments } = useListNominationSessionAttachmentsQuery({
    sessionId: props.sessionId
  });

  return (
    <div className="my-4 flex flex-col gap-4">
      <ReportsTable headers={headers} reports={reports}>
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
