import Stepper from '@codegouvfr/react-dsfr/Stepper';
import clsx from 'clsx';

import { AgendaBreadCrumb } from './components/AgendaBreadcrumb';
import { useAgenda } from './context/AgendaContext';
import { AgendaProvider } from './context/AgendaProvider';
import { AgendaMetadataStep } from './steps/AgendaMetadataStep';
import { AgendaNominationFilesStep } from './steps/AgendaNominationFilesStep';

function AgendaContent() {
  const { step } = useAgenda();

  return (
    <div className="fr-container fr-py-2w">
      <AgendaBreadCrumb />
      <Stepper currentStep={step.index} stepCount={2} title={step.title} nextTitle={step.nextTitle} />
      <AgendaMetadataStep className={clsx({ hidden: step.index !== 1 })} />
      <AgendaNominationFilesStep className={clsx({ hidden: step.index !== 2 })} />
    </div>
  );
}

export function CreateOrUpdateAgendaPage() {
  return (
    <AgendaProvider>
      <AgendaContent />
    </AgendaProvider>
  );
}
