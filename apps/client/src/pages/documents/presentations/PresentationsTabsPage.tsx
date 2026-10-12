import Badge from '@codegouvfr/react-dsfr/Badge';
import Tabs from '@codegouvfr/react-dsfr/Tabs';
import { memo, useCallback, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Outlet, useMatch, useNavigate } from 'react-router';

import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useListNonPresentedPlansQuery,
  useListPresentationPlansAgendasQuery,
  useListPresentedPlansQuery,
} from '@queries/agenda.queries';

const TAB_PATHS = {
  agendas: ROUTE_PATHS.SG.PRESENTATIONS_AGENDAS,
  past: ROUTE_PATHS.SG.PRESENTATIONS_PAST,
  ready: ROUTE_PATHS.SG.PRESENTATIONS_READY,
};

const PresentationsBreadcrumb = memo(function PresentationsBreadcrumb() {
  const { formatMessage } = useIntl();

  return (
    <Breadcrumb
      ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane des restitutions DSJ" })}
      breadcrumb={{
        currentPageLabel: formatMessage({ defaultMessage: `Restitutions` }),
        segments: [
          {
            label: formatMessage({ defaultMessage: 'Secrétariat Général' }),
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

  const agendasPathMatch = useMatch(ROUTE_PATHS.SG.PRESENTATIONS_AGENDAS);
  const pastPathMatch = useMatch(ROUTE_PATHS.SG.PRESENTATIONS_PAST);

  const { data: agendas } = useListPresentationPlansAgendasQuery();
  const { data: plans } = useListNonPresentedPlansQuery();
  const { data: presented } = useListPresentedPlansQuery();

  const tabId = agendasPathMatch !== null ? 'agendas' : pastPathMatch !== null ? 'past' : 'ready';
  const onTabChange = useCallback(
    (tabId: string) => navigate(generatePath(TAB_PATHS[tabId as keyof typeof TAB_PATHS])),
    [navigate],
  );

  const counter = (label: ReactNode[]) => (
    <Badge as="span" className="fr-ml-1v" small>
      {label}
    </Badge>
  );

  const tabLabelAgendas = formatMessage(
    {
      defaultMessage: `{count, plural,
        =0 {Ordres du jour}
        one {Ordre du jour <counter>{count}</counter>}
        other {Ordres du jour <counter>{count}</counter>}}`,
    },
    { count: (agendas?.items ?? []).length, counter },
  );
  const tabLabelReady = formatMessage(
    {
      defaultMessage: `{count, plural,
        =0 {Notices à restituer}
        one {Notice à restituer <counter>{count}</counter>}
        other {Notices à restituer <counter>{count}</counter>}}`,
    },
    { count: (plans?.items ?? []).length, counter },
  );
  const tabLabelPast = formatMessage(
    {
      defaultMessage: `{count, plural,
        =0 {Notices restituées}
        one {Notice restituée <counter>{count}</counter>}
        other {Notices restituées <counter>{count}</counter>}}`,
    },
    { count: presented?.totalCount ?? 0, counter },
  );

  return (
    <div className="fr-pt-8v fr-pb-8v grow bg-(--background-alt-grey)">
      <div className="fr-container">
        <PresentationsBreadcrumb />
        <h1 className="fr-h2 fr-mb-8v">
          <FormattedMessage defaultMessage="Restitutions" />
        </h1>

        <Tabs
          classes={{ panel: 'ring-(--border-default-grey) ring-1' }}
          className="shadow-none! before:shadow-none!"
          onTabChange={onTabChange}
          selectedTabId={tabId}
          tabs={[
            { label: tabLabelAgendas, tabId: 'agendas' },
            { label: tabLabelReady, tabId: 'ready' },
            { label: tabLabelPast, tabId: 'past' },
          ]}
        >
          <Outlet />
        </Tabs>
      </div>
    </div>
  );
}
