import Alert from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import { SegmentedControl } from '@codegouvfr/react-dsfr/SegmentedControl';
import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { markPreviewSeen } from '@/features/feedback/utils/preview-seen.utils';
import type { SessionFeedback } from '@queries/feedback.queries';

import { SessionFeedbackForm } from './SessionFeedbackForm';

export function SessionFeedbackPreview(props: {
  questionnaire: SessionFeedback['questionnaire'];
  sessionId: string;
  sessionPath: string;
}) {
  const { formatMessage } = useIntl();
  useEffect(() => markPreviewSeen(props.sessionId), [props.sessionId]);
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
          <Button linkProps={{ to: props.sessionPath }}>
            <FormattedMessage defaultMessage="Retour à la session" />
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Alert
        className="fr-mb-6v"
        description={formatMessage({
          defaultMessage:
            "En tant qu'administrateur, vous pouvez parcourir le questionnaire. Vos réponses ne seront ni enregistrées ni comptabilisées.",
        })}
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
      <SessionFeedbackForm
        isPreview
        isSubmitting={false}
        key={questionnaire}
        onSubmit={() => setDone(true)}
        questionnaire={questionnaire}
      />
    </>
  );
}
