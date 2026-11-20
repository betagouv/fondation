import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { AdminSurveyForm } from '@/features/survey/components/AdminSurveyForm';
import { SurveyForm } from '@/features/survey/components/SurveyForm';
import { SurveyHeader } from '@/features/survey/components/SurveyHeader';
import { SurveyLastAnswerNotice } from '@/features/survey/components/SurveyLastAnswerNotice';
import { SurveyThanks } from '@/features/survey/components/SurveyThanks';
import { useToasts } from '@/shared/ui/toast';
import type { AnswerSurveyDto } from '@api/types';
import { useAnswerSurveyMutation, useSurveyQuery } from '@queries/survey.queries';

export function SurveyPage() {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const { data: survey, isPending } = useSurveyQuery();
  const answer = useAnswerSurveyMutation();
  const [isSent, setSent] = useState(false);

  if (isPending) return null;

  const submit = (answers: AnswerSurveyDto) =>
    answer.mutate(answers, {
      onError: () =>
        toasts.error({ title: formatMessage({ defaultMessage: "Votre réponse n'a pas pu être envoyée" }) }),
      onSuccess: () => setSent(true),
    });

  if (!survey) {
    return (
      <div className="fr-container fr-py-10v">
        <FormattedMessage defaultMessage="Aucun avis n'est attendu de votre part." />
      </div>
    );
  }

  return (
    <div className="flex grow flex-col">
      <div className="fr-container fr-pt-8v fr-pb-6v">
        <SurveyHeader />
      </div>
      <div className="grow bg-(--background-alt-grey)">
        <div className="fr-container fr-py-10v">
          <div className="fr-grid-row fr-grid-row--center">
            <section className="fr-col-12 fr-col-lg-8 fr-px-10v fr-py-8v bg-(--background-default-grey)">
              {isSent ? (
                <SurveyThanks />
              ) : (
                <>
                  {survey.last && <SurveyLastAnswerNotice answeredOn={survey.last.answeredOn} />}
                  {survey.status === 'PREVIEW' || survey.status === 'TEST' ? (
                    <AdminSurveyForm
                      isSubmitting={answer.isPending}
                      onSubmit={survey.status === 'TEST' ? submit : undefined}
                      questionnaire={survey.questionnaire}
                    />
                  ) : (
                    <SurveyForm
                      isSubmitting={answer.isPending}
                      onSubmit={submit}
                      questionnaire={survey.questionnaire}
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
