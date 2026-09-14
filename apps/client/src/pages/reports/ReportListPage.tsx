import { useOutletContext } from 'react-router';

import { MemberSessionFilesTable } from '@/features/nomination-files-table/components/MemberSessionFilesTable';
import { ReportListViewToggle } from '@/features/reports/components/ReportListViewToggle';

import type { MemberSessionOutletContext } from './member-session-outlet-context.type';

export function ReportListPage() {
  const { filtersSlot, session } = useOutletContext<MemberSessionOutletContext>();

  return (
    <MemberSessionFilesTable
      filtersEnd={<ReportListViewToggle />}
      filtersSlot={filtersSlot}
      formation={session.formation}
      outcomes={session.outcomes}
      sessionId={session.id}
    />
  );
}
export default ReportListPage;
