import Stepper from '@codegouvfr/react-dsfr/Stepper';
import clsx from 'clsx';

import { useOfficialReport } from './context/OfficialReportContext';
import { OfficialReportProvider } from './context/OfficialReportProvider';
import { OfficialReportMetadataStep } from './steps/OfficialReportMetadataStep';
import { OfficialReportSelectionsStep } from './steps/OfficialReportSelectionsStep';

function OfficialReportContent() {
  const { step } = useOfficialReport();

  return (
    <div className="fr-container fr-py-2w">
      <Stepper currentStep={step.index} stepCount={2} title={step.title} nextTitle={step.nextTitle} />
      <OfficialReportMetadataStep className={clsx({ hidden: step.index !== 1 })} />
      <OfficialReportSelectionsStep className={clsx({ hidden: step.index !== 2 })} />
    </div>
  );
}

export function CreateOfficialReportPage() {
  return (
    <OfficialReportProvider>
      <OfficialReportContent />
    </OfficialReportProvider>
  );
}
