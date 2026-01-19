import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { useSummary } from '@/pages/summary/SummaryContext';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import Button from '@codegouvfr/react-dsfr/Button';
import { useUser } from '@queries/auth.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';
import { useNavigate } from 'react-router-dom';

export function SummaryBreadcrumb() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { sessionId, nominationFileId } = useSummary();
  const { data } = useDetailedNominationSessionQuery({
    sessionId: user?.role === 'ADJOINT_SECRETAIRE_GENERAL' ? sessionId : undefined
  });

  if (user?.role !== 'ADJOINT_SECRETAIRE_GENERAL' || !data) return null;

  return (
    <div className="mb-8 flex items-center justify-between">
      <Breadcrumb
        id="summary-breadcrumb"
        className="mb-0"
        ariaLabel={`Fil d'Ariane de la synthèse de ${data.name}`}
        breadcrumb={{
          segments: [
            { label: 'Secrétariat général', to: ROUTE_PATHS.SG.DASHBOARD },
            { label: 'Gérer une session', to: ROUTE_PATHS.SG.MANAGE_SESSION },
            {
              label: data.name,
              to: {
                pathname: ROUTE_PATHS.SG.SESSION_ID.replace(':sessionId', sessionId),
                search: `?active=${nominationFileId}`
              }
            }
          ],
          currentPageLabel: 'Synthèse'
        }}
      />
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
