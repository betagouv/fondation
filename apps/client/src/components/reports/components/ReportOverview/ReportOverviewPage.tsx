import type { FC } from 'react';

import { useParams } from 'react-router';
import ReportOverview from './ReportOverview';

export const ReportOverviewPage: FC = () => {
  const { id } = useParams() as { id: string };
  return <ReportOverview id={id} />;
};
export default ReportOverviewPage;
