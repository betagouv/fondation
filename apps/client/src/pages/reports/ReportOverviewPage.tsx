import { useParams } from 'react-router';

import ReportOverview from '@/features/reports/components/ReportOverview';
import { useScrollToTop } from '@/shared/hooks/useScrollToTop';

export function ReportOverviewPage() {
  const { id } = useParams() as { id: string };

  useScrollToTop(id);

  // without the key a cached report keeps the previous editor content
  return <ReportOverview id={id} key={id} />;
}
export default ReportOverviewPage;
