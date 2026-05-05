import { OfficialReportForm } from './components/OfficialReportForm';
import { OfficialReportProvider } from './context/OfficialReportProvider';

export function CreateOrUpdateOfficialReportPage() {
  return (
    <OfficialReportProvider>
      <div className="fr-container fr-py-5w">
        <OfficialReportForm />
      </div>
    </OfficialReportProvider>
  );
}
