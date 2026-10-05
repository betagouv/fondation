import Button from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useParams } from 'react-router';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { SessionFeedbackForm } from '@/features/feedback/components/SessionFeedbackForm';
import { SessionFeedbackHeader } from '@/features/feedback/components/SessionFeedbackHeader';
import { SessionFeedbackPreview } from '@/features/feedback/components/SessionFeedbackPreview';
import { useToasts } from '@/shared/ui/toast';
import { HttpException } from '@/utils/http-exception';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useAnswerSessionFeedbackMutation, useSessionFeedbackQuery } from '@queries/feedback.queries';

export function SessionFeedbackPage() {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const { sessionId = '' } = useParams();
  const context = useIsSgNavigation() ? 'sg' : 'membre';
  const { data: feedback, isPending } = useSessionFeedbackQuery({ sessionId });
  const answer = useAnswerSessionFeedbackMutation();
  const [isSent, setSent] = useState(false);

  if (isPending) return null;

  if (!feedback) {
    return (
      <div className="fr-container fr-py-10v">
        <FormattedMessage defaultMessage="Aucun avis n'est attendu de votre part sur cette session." />
      </div>
    );
  }

  const sessionPath = generatePath(
    context === 'sg' ? ROUTE_PATHS.SG.SESSION_ID : ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS,
    { sessionId },
  );

  return (
    <div className="flex grow flex-col">
      <div className="fr-container fr-py-6v">
        <SessionFeedbackHeader context={context} session={feedback.session} />
      </div>
      <div className="grow bg-(--background-alt-grey)">
        <div className="fr-container fr-py-10v">
          <div className="fr-grid-row fr-grid-row--center">
            <section className="fr-col-12 fr-col-lg-8 fr-px-10v fr-py-8v bg-(--background-default-grey)">
              {feedback.status === 'PREVIEW' ? (
                <SessionFeedbackPreview
                  questionnaire={feedback.questionnaire}
                  sessionId={sessionId}
                  sessionPath={sessionPath}
                />
              ) : isSent || feedback.status === 'ANSWERED' ? (
                <>
                  <h2 className="fr-h4">
                    <FormattedMessage defaultMessage="Merci pour votre avis" />
                  </h2>
                  <p>
                    <FormattedMessage defaultMessage="Vos réponses sur cette session sont enregistrées." />
                  </p>
                  <Button linkProps={{ to: sessionPath }} priority="secondary">
                    <FormattedMessage defaultMessage="Retour à la session" />
                  </Button>
                </>
              ) : (
                <>
                  <SessionFeedbackForm
                    isSubmitting={answer.isPending}
                    onSubmit={(answers) =>
                      answer.mutate(
                        { answers, sessionId },
                        {
                          onError: (error) => {
                            // already given from another tab: nothing is lost
                            if (error instanceof HttpException && error.statusCode === 409) return;
                            toasts.error({
                              title: formatMessage({ defaultMessage: "Votre avis n'a pas pu être envoyé" }),
                            });
                          },
                          onSuccess: () => setSent(true),
                        },
                      )
                    }
                    questionnaire={feedback.questionnaire}
                  />
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
