import Alert from '@codegouvfr/react-dsfr/Alert';
import Stepper from '@codegouvfr/react-dsfr/Stepper';
import clsx from 'clsx';

import { AgendaBreadCrumb } from './components/AgendaBreadcrumb';
import { useAgenda } from './context/AgendaContext';
import { AgendaProvider } from './context/AgendaProvider';
import { AgendaMetadataStep } from './steps/AgendaMetadataStep';
import { AgendaNominationFilesStep } from './steps/AgendaNominationFilesStep';

function AgendaContent() {
  const { step, error } = useAgenda();

  return (
    <div className="fr-container fr-py-4v">
      <AgendaBreadCrumb />
      {error && <Alert className="fr-mb-6v" title={error} as="h2" severity="error" closable />}
      <Stepper currentStep={step.index} stepCount={2} title={step.title} nextTitle={step.nextTitle} />
      <AgendaNominationFilesStep className={clsx({ hidden: step.index !== 1 })} />
      <AgendaMetadataStep className={clsx({ hidden: step.index !== 2 })} />
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
