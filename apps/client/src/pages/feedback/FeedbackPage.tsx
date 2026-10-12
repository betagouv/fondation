import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { AdminFeedbackForm } from '@/features/feedback/components/AdminFeedbackForm';
import { FeedbackForm } from '@/features/feedback/components/FeedbackForm';
import { FeedbackHeader } from '@/features/feedback/components/FeedbackHeader';
import { FeedbackLastAnswerNotice } from '@/features/feedback/components/FeedbackLastAnswerNotice';
import { FeedbackThanks } from '@/features/feedback/components/FeedbackThanks';
import { useToasts } from '@/shared/ui/toast';
import type { AnswerFeedbackDto } from '@api/types';
import { useAnswerFeedbackMutation, useFeedbackQuery } from '@queries/feedback.queries';

export function FeedbackPage() {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const { data: feedback, isPending } = useFeedbackQuery();
  const answer = useAnswerFeedbackMutation();
  const [isSent, setSent] = useState(false);

  if (isPending) return null;

  const submit = (answers: AnswerFeedbackDto) =>
    answer.mutate(answers, {
      onError: () =>
        toasts.error({ title: formatMessage({ defaultMessage: "Votre réponse n'a pas pu être envoyée" }) }),
      onSuccess: () => setSent(true),
    });

  if (!feedback) {
    return (
      <div className="fr-container fr-py-10v">
        <FormattedMessage defaultMessage="Aucun avis n'est attendu de votre part." />
      </div>
    );
  }

  return (
    <div className="flex grow flex-col">
      <div className="fr-container fr-py-6v">
        <FeedbackHeader />
      </div>
      <div className="grow bg-(--background-alt-grey)">
        <div className="fr-container fr-py-10v">
          <div className="fr-grid-row fr-grid-row--center">
            <section className="fr-col-12 fr-col-lg-8 fr-px-10v fr-py-8v bg-(--background-default-grey)">
              {isSent ? (
                <FeedbackThanks />
              ) : (
                <>
                  {feedback.last && <FeedbackLastAnswerNotice answeredOn={feedback.last.answeredOn} />}
                  {feedback.status === 'PREVIEW' || feedback.status === 'TEST' ? (
                    <AdminFeedbackForm
                      isSubmitting={answer.isPending}
                      onSubmit={feedback.status === 'TEST' ? submit : undefined}
                      questionnaire={feedback.questionnaire}
                    />
                  ) : (
                    <FeedbackForm
                      isSubmitting={answer.isPending}
                      onSubmit={submit}
                      questionnaire={feedback.questionnaire}
                    />
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
