import Button from '@codegouvfr/react-dsfr/Button';
import { useNavigate } from 'react-router';

import { transparencyToLabel } from '@/components/reports/labels/labels-mappers';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { useSummary } from '@/features/summary/context/SummaryContext';
import { useIsSg } from '@/hooks/roles.hook';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

export function SummaryBreadcrumb() {
  const isSg = useIsSg(true);
  switch (isSg) {
    case null:
      return null;
    case true:
      return <SgSummaryBreadcrumb />;
    case false:
      return <MemberSummaryBreadcrumb />;
  }
}

function SgSummaryBreadcrumb() {
  const navigate = useNavigate();
  const { sessionId, nominationFileId, summary } = useSummary();
  const { data } = useDetailedNominationSessionQuery({ sessionId });

  return (
    <div className="fr-mb-8v flex items-center justify-between">
      {data && (
        <Breadcrumb
          id="summary-breadcrumb"
          className="fr-mb-0"
          ariaLabel={`Fil d'Ariane de la synthèse de ${summary.name}`}
          breadcrumb={{
            segments: [
              { label: 'Secrétariat général', to: ROUTE_PATHS.SG.DASHBOARD },
              { label: 'Gérer une session', to: ROUTE_PATHS.SG.MANAGE_SESSION },
              {
                label: data.name,
                to: {
                  pathname: ROUTE_PATHS.SG.SESSION_ID.replace(':sessionId', sessionId),
                  search: `?active=${nominationFileId}`,
                },
              },
            ],
            currentPageLabel: 'Synthèse',
          }}
        />
      )}
      {window.history.length ? (
        <Button
          size="small"
          iconId="fr-icon-close-line"
          iconPosition="right"
          priority="tertiary no outline"
          onClick={() => navigate(-1)}
        >
          Fermer
        </Button>
      ) : null}
    </div>
  );
}

function MemberSummaryBreadcrumb() {
  const navigate = useNavigate();
  const { sessionId, summary } = useSummary();
  const { data } = useDetailedNominationSessionQuery({ sessionId });

  return (
    <div className="fr-mb-8v flex items-center justify-between">
      {data && (
        <Breadcrumb
          id="summary-breadcrumb"
          className="fr-mb-0"
          ariaLabel={`Fil d'Ariane de la synthèse de ${summary.name}`}
          breadcrumb={{
            segments: [
              { label: 'Transparences', to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD },
              {
                label: 'Pouvoir de proposition du garde des Sceaux',
                to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
              },
              {
                label: transparencyToLabel(data.name, data.date),
                to: ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS.replace(':sessionId', sessionId),
              },
            ],
            currentPageLabel: 'Synthèse',
          }}
        />
      )}
      {window.history.length ? (
        <Button
          size="small"
          iconId="fr-icon-close-line"
          iconPosition="right"
          priority="tertiary no outline"
          onClick={() => navigate(-1)}
        >
          Fermer
        </Button>
      ) : null}
    </div>
  );
}
