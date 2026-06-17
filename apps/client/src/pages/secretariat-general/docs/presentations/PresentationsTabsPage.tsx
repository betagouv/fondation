import Badge from '@codegouvfr/react-dsfr/Badge';
import Tabs from '@codegouvfr/react-dsfr/Tabs';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Outlet, useMatch, useNavigate } from 'react-router';

import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useListPresentationPlansAgendasQuery } from '@queries/agenda.queries';

const PresentationsBreadcrumb = React.memo(function PresentationsBreadcrumb() {
  const { $t } = useIntl();
  return (
    <Breadcrumb
      id="presentations-breadcrumb"
      ariaLabel={$t({ defaultMessage: "Fil d'Ariane des restitutions DSJ" })}
      breadcrumb={{
        currentPageLabel: $t({ defaultMessage: `Restitutions` }),
        segments: [
          {
            label: $t({ defaultMessage: 'Secrétariat Général' }),
            to: generatePath(ROUTE_PATHS.SG.DASHBOARD),
          },
        ],
      }}
    />
  );
});

export function PresentationsTabsPage() {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  const pastPathMatch = useMatch(ROUTE_PATHS.SG.PRESENTATIONS_PAST);

  const { data: agendas } = useListPresentationPlansAgendasQuery();

  const tabId = pastPathMatch !== null ? 'past' : 'ready';
  const onTabChange = React.useCallback(
    (tabId: string) => {
      const path = tabId === 'past' ? ROUTE_PATHS.SG.PRESENTATIONS_PAST : ROUTE_PATHS.SG.PRESENTATIONS_READY;
      return navigate(generatePath(path));
    },
    [navigate],
  );

  const tabLabelPast = formatMessage({ defaultMessage: 'Passées' });
  const tabLabelReady = formatMessage(
    {
      defaultMessage: '{count, plural, =0 {À restituer} other {À restituer <counter>{count}</counter>}}',
    },
    {
      count: (agendas?.items ?? []).length,
      counter: (label) => (
        <Badge className="fr-ml-1v" as="span" small>
          {label}
        </Badge>
      ),
    },
  );

  return (
    <div className="fr-container fr-pt-4v">
      <PresentationsBreadcrumb />
      <h1>
        <FormattedMessage defaultMessage="Restitutions" />
      </h1>

      <Tabs
        className="shadow-none! before:shadow-none!"
        classes={{ panel: 'ring-gray-200 ring-1' }}
        selectedTabId={tabId}
        onTabChange={onTabChange}
        tabs={[
          { tabId: 'past', label: tabLabelPast },
          { tabId: 'ready', label: tabLabelReady },
        ]}
      >
        <Outlet />
      </Tabs>
    </div>
  );
}
