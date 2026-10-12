import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage } from 'react-intl';

export function FeedbackThanks() {
  return (
    <>
      <h2 className="fr-h4">
        <FormattedMessage defaultMessage="Merci pour votre réponse" />
      </h2>
      <p>
        <FormattedMessage defaultMessage="Vos réponses sont enregistrées. Vous pouvez répondre de nouveau au questionnaire à tout moment." />
      </p>
      <Button linkProps={{ to: '/' }} priority="secondary">
        <FormattedMessage defaultMessage="Retour à l'accueil" />
      </Button>
    </>
  );
}
