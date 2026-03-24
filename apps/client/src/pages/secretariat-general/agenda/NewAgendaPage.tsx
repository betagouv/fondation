import Stepper from '@codegouvfr/react-dsfr/Stepper';

import clsx from 'clsx';
import { useNewAgenda } from './context/NewAgendaContext';
import { NewAgendaProvider } from './context/NewAgendaProvider';
import { AgendaMetadataStep } from './steps/AgendaMetadataStep';
import { AgendaNominationFilesStep } from './steps/AgendaNominationFilesStep';

function NewAgendaContent() {
  const { step } = useNewAgenda();

  return (
    <div className="fr-container fr-py-2w">
      <Stepper currentStep={step.index} stepCount={2} title={step.title} nextTitle={step.nextTitle} />
      <AgendaMetadataStep className={clsx({ hidden: step.index !== 1 })} />
      <AgendaNominationFilesStep className={clsx({ hidden: step.index !== 2 })} />
    </div>
  );
}

export function NewAgendaPage() {
  return (
    <NewAgendaProvider>
      <NewAgendaContent />
    </NewAgendaProvider>
  );
}
