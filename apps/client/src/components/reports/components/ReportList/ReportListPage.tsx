import { ToggleSwitch } from '@codegouvfr/react-dsfr/ToggleSwitch';
import { useMemo, type FC } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { useUser } from '@queries/auth.queries';
import { useDetailedMemberGdsSession } from '@queries/members.queries';

import type { FormationEnum } from '@/types/enums.types';
import { PageContentLayout } from '../../../shared/PageContentLayout';
import { HeaderReportList } from './HeaderReportList';
import { ReportList } from './ReportList';
import { ReportsDnVueGenerale } from './ReportsDnVueGenerale';

export const ReportListPage: FC = () => {
  const routeParams = useParams();
  const { user } = useUser();

  const { data: detailedGdsSession, isPending: isGdsSessionPending } = useDetailedMemberGdsSession({
    sessionId: routeParams.sessionId,
    userId: user?.id
  });

  const [searchParams, setSearchParams] = useSearchParams({
    focus: 'affectations' as 'general' | 'affectations'
  });

  const isVueGenerale = searchParams.get('focus') === 'general';

  const VueGeneraleSwitch = useMemo(
    () => (
      <ToggleSwitch
        label={isVueGenerale ? 'Tous les dossiers' : 'Mes dossiers'}
        checked={isVueGenerale}
        onChange={(checked) => {
          setSearchParams((s) => {
            s.set('focus', checked ? 'general' : 'affectations');
            return s;
          });
        }}
        showCheckedHint={false}
        labelPosition="right"
        className="nowrap"
        classes={{
          label: 'flex-nowrap flex-grow whitespace-nowrap before:!mr-3'
        }}
      />
    ),
    [isVueGenerale, setSearchParams]
  );

  if (isGdsSessionPending || !detailedGdsSession) return null;

  return (
    <PageContentLayout>
      <HeaderReportList
        formation={detailedGdsSession.data.session.formation as FormationEnum}
        transparency={detailedGdsSession.data.session.transparency}
        dateTransparence={detailedGdsSession.data.session.dateTransparence}
        dueDate={detailedGdsSession.data.session.dateSeance}
      />

      {isVueGenerale ? (
        <ReportsDnVueGenerale
          sessionId={detailedGdsSession.data.session.id}
          formation={detailedGdsSession.data.session.formation as FormationEnum}
        >
          {VueGeneraleSwitch}
        </ReportsDnVueGenerale>
      ) : (
        <ReportList reports={detailedGdsSession.data.reports} sessionId={detailedGdsSession.data.session.id}>
          {VueGeneraleSwitch}
        </ReportList>
      )}
    </PageContentLayout>
  );
};
export default ReportListPage;
