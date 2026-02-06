import { type FC } from 'react';
import { useParams } from 'react-router';

import { useUser } from '@queries/auth.queries';
import { useDetailedMemberGdsSession } from '@queries/members.queries';

import type { FormationEnum } from '@/types/enums.types';
import { PageContentLayout } from '../../../shared/PageContentLayout';
import { ReportListViewToggle } from './ReportListViewToggle';
import { HeaderReportList } from './HeaderReportList';
import { ReportList } from './ReportList';
import { ReportsDnVueGenerale } from './ReportsDnVueGenerale';
import { useReportListFocus } from './useReportListFocus';

export const ReportListPage: FC = () => {
  const { user } = useUser();
  const routeParams = useParams();
  const [focus] = useReportListFocus();

  const { data: detailedGdsSession, isPending: isGdsSessionPending } = useDetailedMemberGdsSession({
    sessionId: routeParams.sessionId,
    userId: user?.id
  });

  if (isGdsSessionPending || !detailedGdsSession) return null;

  return (
    <PageContentLayout>
      <HeaderReportList
        formation={detailedGdsSession.data.session.formation as FormationEnum}
        transparency={detailedGdsSession.data.session.transparency}
        dateTransparence={detailedGdsSession.data.session.dateTransparence}
        dueDate={detailedGdsSession.data.session.dateSeance}
      />

      {focus === 'general' ? (
        <ReportsDnVueGenerale
          sessionId={detailedGdsSession.data.session.id}
          formation={detailedGdsSession.data.session.formation as FormationEnum}
        >
          <ReportListViewToggle />
        </ReportsDnVueGenerale>
      ) : (
        <ReportList reports={detailedGdsSession.data.reports} sessionId={detailedGdsSession.data.session.id}>
          <ReportListViewToggle />
        </ReportList>
      )}
    </PageContentLayout>
  );
};
export default ReportListPage;
