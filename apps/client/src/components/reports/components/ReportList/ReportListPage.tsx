import { ToggleSwitch } from '@codegouvfr/react-dsfr/ToggleSwitch';
import { useMemo, type FC } from 'react';
import { PageContentLayout } from '../../../shared/PageContentLayout';
import { ReportList } from './ReportList';

import { useParams, useSearchParams } from 'react-router-dom';
import { useDetailedGdsSession } from '../../../../react-query/queries/members/sessions.queries';
import { HeaderReportList } from './HeaderReportList';
import { ReportsDnVueGenerale } from './ReportsDnVueGenerale';

export const ReportListPage: FC = () => {
  const routeParams = useParams();
  const { data: detailedGdsSession, isPending: isGdsSessionPending } = useDetailedGdsSession(
    routeParams.sessionId
  );

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
        formation={detailedGdsSession.data.session.formation}
        transparency={detailedGdsSession.data.session.transparency}
        dateTransparence={detailedGdsSession.data.session.dateTransparence}
      />

      {isVueGenerale ? (
        <ReportsDnVueGenerale sessionImportId={detailedGdsSession.data.session.sessionImportId}>
          {VueGeneraleSwitch}
        </ReportsDnVueGenerale>
      ) : (
        <ReportList
          reports={detailedGdsSession.data.reports}
          sessionImportId={detailedGdsSession.data.session.sessionImportId}
        >
          {VueGeneraleSwitch}
        </ReportList>
      )}
    </PageContentLayout>
  );
};
export default ReportListPage;
