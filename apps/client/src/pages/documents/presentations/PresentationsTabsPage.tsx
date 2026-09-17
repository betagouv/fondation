import Badge from '@codegouvfr/react-dsfr/Badge';
import Tabs from '@codegouvfr/react-dsfr/Tabs';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Outlet, useMatch, useNavigate } from 'react-router';

import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useListPresentationPlansAgendasQuery } from '@queries/agenda.queries';

const PresentationsBreadcrumb = React.memo(function PresentationsBreadcrumb() {
  const { $t } = useIntl();
  return (
    <Breadcrumb
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
      id="presentations-breadcrumb"
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
        <Badge as="span" className="fr-ml-1v" small>
          {label}
        </Badge>
      ),
    },
  );

  return (
    <div className="fr-container fr-pt-8v">
      <PresentationsBreadcrumb />
      <h1>
        <FormattedMessage defaultMessage="Restitutions" />
      </h1>

      <Tabs
        classes={{ panel: 'ring-(--border-default-grey) ring-1' }}
        className="shadow-none! before:shadow-none!"
        onTabChange={onTabChange}
        selectedTabId={tabId}
        tabs={[
          { label: tabLabelPast, tabId: 'past' },
          { label: tabLabelReady, tabId: 'ready' },
        ]}
      >
        <Outlet />
      </Tabs>
    </div>
  );
}
