import type { NominationFile } from 'shared-models';
import type { DetailedSessionReport } from '../../../../react-query/queries/members/sessions.queries';
import { useListNominationSessionAttachmentsQuery } from '../../../../react-query/mutations/sg/nomination-sessions';

import { ReportsTable } from './ReportsTable';
import { NominationSessionAttachmentList } from '../../../shared/NominationSessionAttachmentList';

export interface ReportFiltersState {
  states: NominationFile.ReportState[];
}

export interface ReportListPaginationProps {
  currentPage: number;
  limit: number;
  displayedItems: number;
  totalItems: number;
  totalPages: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  getPageUrl: (pageNumber: number) => string;
}

export interface ReportListProps {
  sessionId: string;
  reports: DetailedSessionReport[];
  isLoading: boolean;
  filters: ReportFiltersState;
  setFilters: (filters: ReportFiltersState) => void;
  setSort: (field: string) => void;
  getSortIcon: (field: string) => 'fr-icon-arrow-down-line' | 'fr-icon-arrow-up-line';
  pagination: ReportListPaginationProps;
}

export function ReportList(props: React.PropsWithChildren<ReportListProps>) {
  const { data: attachments } = useListNominationSessionAttachmentsQuery({
    sessionId: props.sessionId
  });

  return (
    <div className="my-4 flex flex-col gap-4">
      <ReportsTable
        reports={props.reports}
        isLoading={props.isLoading}
        filters={props.filters}
        setFilters={props.setFilters}
        setSort={props.setSort}
        getSortIcon={props.getSortIcon}
        pagination={props.pagination}
      >
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
