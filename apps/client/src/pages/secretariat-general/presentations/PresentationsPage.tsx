import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { generatePath, Outlet } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

const PresentationsBreadcrumb = React.memo(function PresentationsBreadcrumb() {
  const { $t } = useIntl();
  return (
    <Breadcrumb
      id="presentations-breadcrumb"
      ariaLabel={$t({ defaultMessage: "Fil d'Ariane des restitutions DSJ" })}
      breadcrumb={{
        currentPageLabel: $t({ defaultMessage: `Restitutions` }),
        segments: [
          { label: $t({ defaultMessage: 'Secrétariat Général' }), to: generatePath(ROUTE_PATHS.SG.DASHBOARD) }
        ]
      }}
    />
  );
});

export function PresentationsPage() {
  // const navigate = useNavigate();
  // const { $t } = useIntl();

  // const pastPathMatch = useMatch(ROUTE_PATHS.SG.PRESENTATIONS_PAST);

  // const tabId = pastPathMatch !== null ? 'past' : 'ready';

  // const onTabChange = React.useCallback(
  //   (tabId: string) => {
  //     if (tabId === 'past') {
  //       const pastPath = generatePath(ROUTE_PATHS.SG.PRESENTATIONS_PAST);
  //       return navigate(pastPath);
  //     }

  //     const readyPath = generatePath(ROUTE_PATHS.SG.PRESENTATIONS_READY);
  //     return navigate(readyPath);
  //   },
  //   [navigate]
  // );

  return (
    <div className="fr-container pt-6">
      <PresentationsBreadcrumb />
      <h1>
        <FormattedMessage defaultMessage="Restitutions à réaliser" /> {/* TODO: rename to "Restitution" */}
      </h1>

      <Outlet />

      {/*
      TODO: add the past behaviour
      <Tabs
        className="shadow-none before:shadow-[inset_0_1px_0_var(--border-default-grey)] before:content-['']"
        selectedTabId={tabId}
        onTabChange={onTabChange}
        tabs={[
          { tabId: 'past', label: $t({ defaultMessage: 'Passées' }) },
          { tabId: 'ready', label: $t({ defaultMessage: 'À restituer' }) }
        ]}
      >
        <Outlet />
      </Tabs> */}
    </div>
  );
}
