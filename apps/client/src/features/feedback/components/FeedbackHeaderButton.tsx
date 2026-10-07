import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage } from 'react-intl';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useUser } from '@queries/auth.queries';

export function FeedbackHeaderButton() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <Button
      className="fr-mb-0 self-center"
      iconId="fr-icon-feedback-line"
      linkProps={{ to: ROUTE_PATHS.FEEDBACK }}
    >
      <FormattedMessage defaultMessage="Donner mon avis" />
    </Button>
  );
}
