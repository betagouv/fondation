import Alert from '@codegouvfr/react-dsfr/Alert';
import { useIntl } from 'react-intl';

import { formatLongDateOnly, type PlainDateOnly } from '@/utils/date-only.util';

export function FeedbackLastAnswerNotice(props: { answeredOn: PlainDateOnly }) {
  const { formatMessage } = useIntl();

  return (
    <Alert
      className="fr-mb-6v"
      description={formatMessage({
        defaultMessage:
          "Vous pouvez y répondre de nouveau à tout moment. Fondation conserve la date de votre dernière réponse afin de vous l'indiquer. Dans les résultats, vos réponses sont exploitées sous un numéro, sans que votre nom y figure.",
      })}
      severity="info"
      title={formatMessage(
        { defaultMessage: 'Vous avez répondu au questionnaire le {date}' },
        { date: formatLongDateOnly(props.answeredOn) },
      )}
    />
  );
}
