import Button from '@codegouvfr/react-dsfr/Button';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useUser } from '@queries/auth.queries';

export function HelpPageButton() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <Button
      linkProps={{ to: ROUTE_PATHS.HELP }}
      iconId="fr-icon-questionnaire-line"
      className="mb-0! self-center"
    >
      Centre d'aide
    </Button>
  );
}
