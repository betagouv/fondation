import { useOutletContext } from 'react-router';

import { MemberSessionFilesTable } from '@/features/nomination-files-table/components/MemberSessionFilesTable';
import { ReportListViewToggle } from '@/features/reports/components/ReportListViewToggle';

import type { MemberSessionOutletContext } from './member-session-outlet-context.type';

export function ReportListPage() {
  const { filtersSlot, session, toolbarSlot } = useOutletContext<MemberSessionOutletContext>();

  return (
    <MemberSessionFilesTable
      filtersEnd={<ReportListViewToggle />}
      filtersSlot={filtersSlot}
      formation={session.formation}
      outcomes={session.outcomes}
      scrollsWithPage
      sessionId={session.id}
      toolbarSlot={toolbarSlot}
    />
  );
}
export default ReportListPage;
