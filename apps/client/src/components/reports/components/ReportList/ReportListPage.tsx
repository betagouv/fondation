import { ToggleSwitch } from '@codegouvfr/react-dsfr/ToggleSwitch';
import { type FC } from 'react';
import { PageContentLayout } from '../../../shared/PageContentLayout';
import { ReportList } from './ReportList';

import { useParams, useSearchParams } from 'react-router-dom';
import { useDetailedGdsSession } from '../../../../react-query/queries/members/sessions.queries';
import { HeaderReportList } from './HeaderReportList';
import { ReportsDnVueGenerale } from './ReportsDnVueGenerale';

// Non renseigné car souhaité ainsi
const VUE_GENERALE_TITLE = '';

export const ReportListPage: FC = () => {
  const routeParams = useParams();
  const { data: detailedGdsSession, isPending: isGdsSessionPending } = useDetailedGdsSession(
    routeParams.sessionId
  );

  const [searchParams, setSearchParams] = useSearchParams({
    focus: 'affectations' as 'general' | 'affectations'
  });

  const isVueGenerale = searchParams.get('focus') === 'general';
  const setIsVueGenerale = (checked: boolean) => {
    setSearchParams({ focus: checked ? 'general' : 'affectations' });
  };

  if (isGdsSessionPending || !detailedGdsSession) return null;

  return (
    <PageContentLayout>
      <HeaderReportList
        formation={detailedGdsSession.data.session.formation}
        transparency={detailedGdsSession.data.session.transparency}
        dateTransparence={detailedGdsSession.data.session.dateTransparence}
      />
      <div className="relative my-8">
        <div className="absolute -top-1 right-0 flex flex-col gap-1">
          <ToggleSwitch
            label={VUE_GENERALE_TITLE}
            checked={isVueGenerale}
            onChange={(checked) => setIsVueGenerale(checked)}
            id="vue-generale-membre"
            showCheckedHint={false}
          />
          <label htmlFor="vue-generale-membre">{isVueGenerale ? 'Tous les dossiers' : 'Mes dossiers'}</label>
        </div>
      </div>
      {isVueGenerale && <ReportsDnVueGenerale />}
      {!isVueGenerale && (
        <ReportList
          reports={detailedGdsSession.data.reports}
          sessionImportId={detailedGdsSession.data.session.sessionImportId}
        />
      )}
    </PageContentLayout>
  );
};
export default ReportListPage;
