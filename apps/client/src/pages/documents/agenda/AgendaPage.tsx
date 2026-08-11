import Alert from '@codegouvfr/react-dsfr/Alert';
import Stepper from '@codegouvfr/react-dsfr/Stepper';
import clsx from 'clsx';

import { AgendaBreadCrumb } from '@/features/agenda/components/AgendaBreadcrumb';
import { AgendaMetadataStep } from '@/features/agenda/components/AgendaMetadataStep';
import { AgendaNominationFilesStep } from '@/features/agenda/components/AgendaNominationFilesStep';
import { useAgenda } from '@/features/agenda/context/AgendaContext';
import { AgendaProvider } from '@/features/agenda/context/AgendaProvider';

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

export function CreateAgendaPage() {
  return (
    <AgendaProvider>
      <AgendaContent />
    </AgendaProvider>
  );
}
