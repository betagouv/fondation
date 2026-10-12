import { OfficialReportBreadCrumb } from '@/features/documents/components/official-report/OfficialReportBreadCrumb';
import { OfficialReportForm } from '@/features/documents/components/official-report/OfficialReportForm';
import { OfficialReportProvider } from '@/features/documents/context/OfficialReportProvider';

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
