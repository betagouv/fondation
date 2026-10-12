import { useMemo, type PropsWithChildren } from 'react';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { useMemberListQuery } from '@queries/members.queries';

import { ExcludedJurisdictionsContext } from './excluded-jurisdictions.context';
import { useNominationFilesTable } from './files-table.context';
import { MemberExcludedJurisdictions } from './member-excluded-jurisdictions';

export function ExcludedJurisdictionsProvider(props: PropsWithChildren) {
  const { formation } = useNominationFilesTable();
  const isSg = useIsSg();
  const { data } = useMemberListQuery({
    enabled: isSg,
    formations: ['COMMUN', formation],
    pagination: { pageIndex: 0, pageSize: 100 },
  });

  const model = useMemo(() => MemberExcludedJurisdictions.fromMembers(data?.items ?? []), [data]);

  return <ExcludedJurisdictionsContext value={model}>{props.children}</ExcludedJurisdictionsContext>;
}
