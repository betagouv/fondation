import { useState, type FC } from 'react';
import { PageContentLayout } from '../../../shared/PageContentLayout';
import { ReportList } from './ReportList';
import { ToggleSwitch } from '@codegouvfr/react-dsfr/ToggleSwitch';

import { ReportsDnVueGenerale } from './ReportsDnVueGenerale';
import { HeaderReportList } from './HeaderReportList';
import { useParams } from 'react-router-dom';
import { DateTransparenceRoutesMapper } from '../../../../utils/date-transparence-routes.utils';
import { GdsTransparenciesRoutesMapper } from '../../../../utils/gds-transparencies-routes.utils';
import { FormationsRoutesMapper } from '../../../../utils/formations-routes.utils';

const VUE_GENERALE_TITLE = 'Vue générale';

export const ReportListPage: FC = () => {
  const [isVueGenerale, setIsVueGenerale] = useState<boolean>(false);

  const { dateTransparence, transparency, formation } = useParams();
  const props = {
    dateTransparence: DateTransparenceRoutesMapper.toDateTransparence(dateTransparence as string),
    transparency: GdsTransparenciesRoutesMapper.toTransparency(transparency as string),
    formation: FormationsRoutesMapper.toFormation(formation as string)
  };

  return (
    <PageContentLayout>
      <HeaderReportList {...props} />
      <ToggleSwitch
        label={VUE_GENERALE_TITLE}
        checked={isVueGenerale}
        onChange={(checked) => setIsVueGenerale(checked)}
        id="vue-generale-membre"
        helperText="Visualiser tous les rapports de la transparence"
      />
      {isVueGenerale && <ReportsDnVueGenerale />}
      {!isVueGenerale && <ReportList {...props} />}
    </PageContentLayout>
  );
};
export default ReportListPage;
