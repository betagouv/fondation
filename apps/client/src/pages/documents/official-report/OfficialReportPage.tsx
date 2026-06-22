import { OfficialReportBreadCrumb } from '@/features/official-report/components/OfficialReportBreadCrumb';
import { OfficialReportForm } from '@/features/official-report/components/OfficialReportForm';
import { OfficialReportProvider } from '@/features/official-report/context/OfficialReportProvider';

export function CreateOrUpdateOfficialReportPage() {
  return (
    <OfficialReportProvider>
      <div className="fr-container fr-py-10v">
        <OfficialReportBreadCrumb />
        <OfficialReportForm />
      </div>
    </OfficialReportProvider>
  );
}
