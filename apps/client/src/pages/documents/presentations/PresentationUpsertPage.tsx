import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Stepper from '@codegouvfr/react-dsfr/Stepper';
import clsx from 'clsx';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Navigate, useParams } from 'react-router';

import { PresentationAgendaCommentsStep } from '@/features/documents/components/presentations/PresentationAgendaCommentsStep';
import { PresentationBreadcrumb } from '@/features/documents/components/presentations/PresentationBreadcrumb';
import { PresentationMetadataStep } from '@/features/documents/components/presentations/PresentationMetadataStep';
import { usePresentationPlan } from '@/features/documents/context/presentation-plan.context';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useJusticePresentationPlanMetadataQuery } from '@queries/agenda.queries';

const STEP_TITLES = {
  AGENDA_COMMENTS: defineMessage({ defaultMessage: 'Commentaires sur les ordres du jour' }),
  METADATA: defineMessage({ defaultMessage: 'Données de la notice' }),
};

export function PresentationUpsertPage() {
  const { formatMessage } = useIntl();
  const { planId } = useParams<{ planId: string }>();
  const { isFetching, state } = usePresentationPlan();
  const { data: metadata } = useJusticePresentationPlanMetadataQuery({ presentationPlanId: planId });

  const stepIndex = state.step === 'METADATA' ? 1 : 2;
  const nextTitle = state.step === 'METADATA' ? formatMessage(STEP_TITLES.AGENDA_COMMENTS) : undefined;

  if (metadata && !metadata.canEdit) {
    return <Navigate replace to={generatePath(ROUTE_PATHS.SG.PRESENTATIONS_PREVIEW, { planId: planId! })} />;
  }

  return (
    <div className="fr-container fr-pt-8v fr-pb-4v">
      <PresentationBreadcrumb />

      {isFetching ? (
        <p
          className={clsx(
            cx('ri-loader-4-line'),
            'text-center before:mr-1 before:animate-spin before:content-[""]',
          )}
        >
          <FormattedMessage defaultMessage={'Chargement...'} />
        </p>
      ) : (
        <>
          <Stepper
            currentStep={stepIndex}
            nextTitle={nextTitle}
            stepCount={2}
            title={formatMessage(STEP_TITLES[state.step])}
          />
          <PresentationMetadataStep className={clsx({ hidden: state.step !== 'METADATA' })} />
          <PresentationAgendaCommentsStep className={clsx({ hidden: state.step !== 'AGENDA_COMMENTS' })} />
        </>
      )}
    </div>
  );
}
