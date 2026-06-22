import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Stepper from '@codegouvfr/react-dsfr/Stepper';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath } from 'react-router';

import { PresentationAgendaCommentsStep } from '@/features/presentations/components/PresentationAgendaCommentsStep';
import { PresentationMetadataStep } from '@/features/presentations/components/PresentationMetadataStep';
import { usePresentationPlan } from '@/features/presentations/context/presentation-plan.context';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

function PresentationBreadcrumb() {
  const { planId } = usePresentationPlan();
  const { formatMessage } = useIntl();
  return (
    <Breadcrumb
      ariaLabel="Fil d'Ariane"
      id="restitutions_breadcrumb"
      breadcrumb={{
        currentPageLabel: planId
          ? formatMessage({ defaultMessage: `Notice de restitution` })
          : formatMessage({ defaultMessage: 'Nouvelle notice de restitution' }),
        segments: [
          { label: 'Secrétariat Général', to: generatePath(ROUTE_PATHS.SG.DASHBOARD) },
          { label: 'Restitutions', to: generatePath(ROUTE_PATHS.SG.PRESENTATIONS_READY) },
        ],
      }}
    />
  );
}

const STEPS = {
  METADATA: { title: 'Métadonnées de la notice' },
  AGENDA_COMMENTS: { title: 'Commentaires sur les ordres du jour' },
} as const;

export function PresentationUpsertPage() {
  const { state, isFetching } = usePresentationPlan();

  const step = STEPS[state.step];
  const stepIndex = state.step === 'METADATA' ? 1 : 2;
  const nextTitle = state.step === 'METADATA' ? STEPS.AGENDA_COMMENTS.title : undefined;

  return (
    <div className="fr-container fr-py-4v">
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
          <Stepper stepCount={2} currentStep={stepIndex} title={step.title} nextTitle={nextTitle} />
          <PresentationMetadataStep className={clsx({ hidden: state.step !== 'METADATA' })} />
          <PresentationAgendaCommentsStep className={clsx({ hidden: state.step !== 'AGENDA_COMMENTS' })} />
        </>
      )}
    </div>
  );
}
