import { ToggleSwitch } from '@codegouvfr/react-dsfr/ToggleSwitch';
import { useMemo, type FC } from 'react';
import { PageContentLayout } from '../../../shared/PageContentLayout';
import { ReportList } from './ReportList';

import { useParams, useSearchParams } from 'react-router-dom';
import { parseAsArrayOf, parseAsStringEnum, useQueryStates } from 'nuqs';
import { NominationFile } from 'shared-models';
import {
  useDetailedGdsSession,
  useGdsSessionReports,
  type ReportSortField
} from '../../../../react-query/queries/members/sessions.queries';
import { useServerPagination } from '../../../../hooks/useServerPagination.hook';
import { HeaderReportList } from './HeaderReportList';
import { ReportsDnVueGenerale } from './ReportsDnVueGenerale';
import { useUser } from '../../../../react-query/queries/use-user.queries';

export const ReportListPage: FC = () => {
  const routeParams = useParams();
  const { user } = useUser();

  const { page, limit, sortField, sortDirection, setPage, setLimit, setSort, getPageUrl, getSortIcon } =
    useServerPagination({ defaultLimit: 25 });

  const [filters, setFilters] = useQueryStates({
    states: parseAsArrayOf(parseAsStringEnum(Object.values(NominationFile.ReportState))).withDefault([])
  });

  const { data: detailedGdsSession, isPending: isGdsSessionPending } = useDetailedGdsSession({
    sessionId: routeParams.sessionId,
    userId: user?.id
  });

  const { data: reportsData, isPending: isReportsPending } = useGdsSessionReports({
    sessionId: routeParams.sessionId,
    userId: user?.id,
    page,
    limit,
    sortField: sortField as ReportSortField | null,
    sortDirection,
    states: filters.states
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

  const totalItems = reportsData?.totalCount ?? 0;
  const totalPages = Math.ceil(totalItems / limit);
  const displayedItems = reportsData?.items.length ?? 0;
  const currentPage = reportsData?.currentPageIndex ?? 1;

  return (
    <PageContentLayout>
      <HeaderReportList
        formation={detailedGdsSession.data.session.formation}
        transparency={detailedGdsSession.data.session.transparency}
        dateTransparence={detailedGdsSession.data.session.dateTransparence}
      />

      {isVueGenerale ? (
        <ReportsDnVueGenerale formation={detailedGdsSession.data.session.formation}>
          {VueGeneraleSwitch}
        </ReportsDnVueGenerale>
      ) : (
        <ReportList
          reports={reportsData?.items ?? []}
          sessionId={detailedGdsSession.data.session.id}
          isLoading={isReportsPending}
          filters={filters}
          setFilters={setFilters}
          setSort={setSort}
          getSortIcon={getSortIcon}
          pagination={{
            currentPage,
            limit,
            displayedItems,
            totalItems,
            totalPages,
            setPage,
            setLimit,
            getPageUrl
          }}
        >
          {VueGeneraleSwitch}
        </ReportList>
      )}
    </PageContentLayout>
  );
};
export default ReportListPage;
