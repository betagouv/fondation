import type { FC } from 'react';

import { useParams } from 'react-router-dom';
import { PageContentLayout } from '../../../shared/PageContentLayout';
import ReportOverview from './ReportOverview';

export const ReportOverviewPage: FC = () => {
  const { id } = useParams() as { id: string };
  return (
    <PageContentLayout fullBackgroundOrange>
      <ReportOverview id={id} />
    </PageContentLayout>
  );
};
export default ReportOverviewPage;
