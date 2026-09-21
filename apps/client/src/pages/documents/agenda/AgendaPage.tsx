import Stepper from '@codegouvfr/react-dsfr/Stepper';
import clsx from 'clsx';
import { useState, type MouseEvent } from 'react';
import { FormattedMessage } from 'react-intl';
import { generatePath, Link, useLocation, useNavigate } from 'react-router';

import { AgendaMetadataStep } from '@/features/documents/components/agenda/AgendaMetadataStep';
import { AgendaNominationFilesStep } from '@/features/documents/components/agenda/AgendaNominationFilesStep';
import { AgendaWorkScreen } from '@/features/documents/components/agenda/AgendaWorkScreen';
import { useAgenda } from '@/features/documents/context/AgendaContext';
import { AgendaProvider } from '@/features/documents/context/AgendaProvider';
import { useScrollToTop } from '@/shared/hooks/useScrollToTop';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

function AgendaContent() {
  const { error, session, step } = useAgenda();
  const navigate = useNavigate();
  const { key: locationKey } = useLocation();
  const [actionsSlot, setActionsSlot] = useState<HTMLDivElement | null>(null);

  useScrollToTop(String(step.index));

  const isSelectingFiles = step.index === 2;

  const goBack = (event: MouseEvent<HTMLAnchorElement>) => {
    if (locationKey === 'default') return;

    event.preventDefault();
    navigate(-1);
  };

  return (
    <AgendaWorkScreen
      actionsRef={setActionsSlot}
      backLink={
        <Link
          className="fr-link fr-link--icon-left fr-icon-arrow-left-line"
          onClick={goBack}
          to={generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: session.id })}
        >
          <FormattedMessage defaultMessage="Quitter" />
        </Link>
      }
      error={error}
      title={
        <div className="w-full md:w-1/2 [&_.fr-stepper]:mb-0">
          <Stepper currentStep={step.index} stepCount={2} title={step.title} />
        </div>
      }
    >
      <AgendaMetadataStep
        actionsSlot={isSelectingFiles ? null : actionsSlot}
        className={clsx({ hidden: isSelectingFiles })}
      />
      <AgendaNominationFilesStep
        actionsSlot={isSelectingFiles ? actionsSlot : null}
        className={clsx({ hidden: !isSelectingFiles })}
        scrollsWithPage
      />
    </AgendaWorkScreen>
  );
}

export function CreateAgendaPage() {
  return (
    <AgendaProvider>
      <AgendaContent />
    </AgendaProvider>
  );
}
