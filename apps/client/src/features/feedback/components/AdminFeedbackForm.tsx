import Alert from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import { SegmentedControl } from '@codegouvfr/react-dsfr/SegmentedControl';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { AnswerFeedbackDto } from '@api/types';
import type { Feedback } from '@queries/feedback.queries';

import { FeedbackForm } from './FeedbackForm';

/** outside production, `onSubmit` sends the answers for real, to test them and their export */
export function AdminFeedbackForm(props: {
  isSubmitting?: boolean;
  onSubmit?: (answers: AnswerFeedbackDto) => void;
  questionnaire: Feedback['questionnaire'];
}) {
  const { formatMessage } = useIntl();
  const [questionnaire, setQuestionnaire] = useState(props.questionnaire);
  const [isDone, setDone] = useState(false);

  if (isDone) {
    return (
      <>
        <h2 className="fr-h4">
          <FormattedMessage defaultMessage="Fin de l'aperçu" />
        </h2>
        <p>
          <FormattedMessage defaultMessage="Aucune réponse n'a été enregistrée." />
        </p>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => setDone(false)} priority="secondary">
            <FormattedMessage defaultMessage="Recommencer l'aperçu" />
          </Button>
          <Button linkProps={{ to: '/' }}>
            <FormattedMessage defaultMessage="Retour à l'accueil" />
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Alert
        className="fr-mb-6v"
        description={
          props.onSubmit
            ? formatMessage({
                defaultMessage: "Recette : vos réponses sont enregistrées, pour tester l'envoi et l'export.",
              })
            : formatMessage({ defaultMessage: 'Aperçu : vos réponses ne sont pas enregistrées.' })
        }
        severity="info"
        small
      />
      <SegmentedControl
        className="fr-mb-8v"
        legend={formatMessage({ defaultMessage: 'Questionnaire affiché' })}
        segments={[
          {
            label: formatMessage({ defaultMessage: 'Secrétariat général' }),
            nativeInputProps: {
              checked: questionnaire === 'SECRETARIAT',
              onChange: () => setQuestionnaire('SECRETARIAT'),
            },
          },
          {
            label: formatMessage({ defaultMessage: 'Membres' }),
            nativeInputProps: {
              checked: questionnaire === 'MEMBER',
              onChange: () => setQuestionnaire('MEMBER'),
            },
          },
        ]}
        small
      />
      <FeedbackForm
        isPreview={!props.onSubmit}
        isSubmitting={props.isSubmitting ?? false}
        key={questionnaire}
        onSubmit={props.onSubmit ?? (() => setDone(true))}
        questionnaire={questionnaire}
      />
    </>
  );
}
