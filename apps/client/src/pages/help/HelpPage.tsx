import Button from '@codegouvfr/react-dsfr/Button';

import { AuthGuard } from '@/components/guards/AuthGuard';
import { AUTHORIZED_ROLES } from '@/constants/authorized-roles.constants';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useUser } from '@queries/auth.queries';

export function HelpPage() {
  return (
    <AuthGuard authorizedRoles={AUTHORIZED_ROLES.ALL}>
      <article className="fr-container fr-py-5w mx-auto w-5/12 min-w-[56rem]">
        <h1 className="flex justify-between">
          <span>Aide au traitement des dossiers</span>
          <Button
            size="large"
            priority="tertiary no outline"
            linkProps={{ to: ROUTE_PATHS.USER_MANUAL }}
            iconId="fr-icon-booklet-fill"
          >
            Manuel utilisateur
          </Button>
        </h1>

        <iframe
          src="https://pineapple-passive-82f.notion.site/ebd//29ba2ff25f15805d8ffaf36cb60c54f9"
          allowFullScreen
          width="100%"
          height="600"
          frameBorder="0"
        />
      </article>
    </AuthGuard>
  );
}

export function HelpPageButton() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <Button linkProps={{ to: ROUTE_PATHS.HELP }} iconId="fr-icon-questionnaire-line" className="self-center">
      Centre d'aide
    </Button>
  );
}
