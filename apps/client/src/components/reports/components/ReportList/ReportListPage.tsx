import type { FC } from 'react';
import { PageContentLayout } from '../../../shared/PageContentLayout';
import { ReportList, type ReportListProps } from './ReportList';
import { useParams } from 'react-router-dom';
import { GdsTransparenciesRoutesMapper } from '../../../../utils/gds-transparencies-routes.utils';
import { FormationsRoutesMapper } from '../../../../utils/formations-routes.utils';
import { DateTransparenceRoutesMapper } from '../../../../utils/date-transparence-routes.utils';

export const ReportListPage: FC = () => {
  const { dateTransparence, transparency, formation } = useParams();
  const props = {
    dateTransparence: DateTransparenceRoutesMapper.toDateTransparence(dateTransparence as string),
    transparency: GdsTransparenciesRoutesMapper.toTransparency(transparency as string),
    formation: FormationsRoutesMapper.toFormation(formation as string)
  } as ReportListProps;
  return (
    <PageContentLayout>
      <ReportList {...props} />
    </PageContentLayout>
  );
};
export default ReportListPage;
