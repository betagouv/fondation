import { useParams } from 'react-router';

import { MemberSessionFilesTable } from '@/features/nomination-files-table/components/MemberSessionFilesTable';
import { HeaderReportList } from '@/features/reports/components/HeaderReportList';
import { MemberSessionToolbar } from '@/features/reports/components/MemberSessionToolbar';
import { ReportListViewToggle } from '@/features/reports/components/ReportListViewToggle';
import { ArchiveBannerPortal } from '@/shared/components/banners';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

export function ReportListPage() {
  const { sessionId } = useParams();
  const { data: session, isPending } = useDetailedNominationSessionQuery({ sessionId });

  if (isPending || !session) return null;

  return (
    <ArchiveBannerPortal isArchived={session.isArchived}>
      <HeaderReportList
        dateTransparence={session.date}
        dueDate={session.dueDate}
        formation={session.formation}
        transparency={session.name}
      />

      <MemberSessionToolbar sessionId={session.id} />

      <div className="fr-mt-6v fr-mb-4v flex flex-col gap-4">
        <MemberSessionFilesTable
          filtersEnd={<ReportListViewToggle />}
          formation={session.formation}
          outcomes={session.outcomes}
          sessionId={session.id}
        />
      </div>
    </ArchiveBannerPortal>
  );
}
export default ReportListPage;
