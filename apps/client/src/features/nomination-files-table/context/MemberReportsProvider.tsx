import { useMemo, type PropsWithChildren } from 'react';

import { useUser } from '@queries/auth.queries';
import { useListMemberSessionReports } from '@queries/members.queries';

import { useNominationFilesTable } from './files-table.context';
import { MemberReports } from './member-reports';
import { MemberReportsContext } from './member-reports.context';

export function MemberReportsProvider(props: PropsWithChildren) {
  const { sessionId } = useNominationFilesTable();
  const { user } = useUser();
  const { data } = useListMemberSessionReports({ sessionId, userId: user?.id });

  const model = useMemo(() => MemberReports.fromReports(data?.items ?? []), [data]);

  return <MemberReportsContext value={model}>{props.children}</MemberReportsContext>;
}
