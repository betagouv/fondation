import { FormattedMessage, useIntl } from 'react-intl';

import { useBreadcrumbRoot } from '@/shared/hooks/useBreadcrumbRoot';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { useMemberBreadcrumbRoot } from '@/utils/transparences-breadcrumb.utils';

import { ArchivedSessionsTable, type Space } from './ArchivedSessionsTable';

export function ArchivedSessions(props: { space: Space; withFormationFilter: boolean }) {
  const { formatMessage } = useIntl();
  const breadcrumbRoot = useBreadcrumbRoot();
  const memberRoot = useMemberBreadcrumbRoot();

  return (
    <>
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane des sessions archivées" })}
        breadcrumb={{
          currentPageLabel: formatMessage({ defaultMessage: 'Sessions archivées' }),
          segments: props.space === 'SG' ? breadcrumbRoot : memberRoot,
        }}
        id="archived-sessions-breadcrumb"
      />
      <ArchivedSessionsTable
        space={props.space}
        title={<FormattedMessage defaultMessage="Sessions archivées" />}
        withFormationFilter={props.withFormationFilter}
      />
    </>
  );
}
