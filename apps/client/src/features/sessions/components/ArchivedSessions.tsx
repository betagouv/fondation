import { FormattedMessage, useIntl } from 'react-intl';

import { Breadcrumb } from '@/shared/ui/Breadcrumb';

import { ArchivedSessionsTable, SPACES, type Space } from './ArchivedSessionsTable';

export function ArchivedSessions(props: { space: Space; withFormationFilter: boolean }) {
  const { formatMessage } = useIntl();

  return (
    <>
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane des sessions archivées" })}
        breadcrumb={{
          currentPageLabel: formatMessage({ defaultMessage: 'Sessions archivées' }),
          segments: [{ label: formatMessage(SPACES[props.space].label), to: SPACES[props.space].home }],
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
