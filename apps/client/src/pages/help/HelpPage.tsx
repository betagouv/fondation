import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage } from 'react-intl';

import { ROUTE_PATHS } from '@/utils/route-path.utils';

export function HelpPage() {
  return (
    <article className="fr-container fr-py-10v mx-auto w-5/12 min-w-4xl">
      <h1 className="flex justify-between">
        <span>
          <FormattedMessage defaultMessage="Aide au traitement des dossiers" />
        </span>
        <Button
          iconId="fr-icon-booklet-fill"
          linkProps={{ to: ROUTE_PATHS.USER_MANUAL }}
          priority="tertiary no outline"
          size="large"
        >
          <FormattedMessage defaultMessage="Manuel utilisateur" />
        </Button>
      </h1>

      <iframe
        allowFullScreen
        className="border-0"
        height="600"
        src="https://pineapple-passive-82f.notion.site/ebd//29ba2ff25f15805d8ffaf36cb60c54f9"
        width="100%"
      />
    </article>
  );
}
