import { ToggleSwitch } from '@codegouvfr/react-dsfr/ToggleSwitch';
import { useState, type FC } from 'react';
import { PageContentLayout } from '../../../shared/PageContentLayout';
import { ReportList } from './ReportList';

import { useParams } from 'react-router-dom';
import { DateTransparenceRoutesMapper } from '../../../../utils/date-transparence-routes.utils';
import { FormationsRoutesMapper } from '../../../../utils/formations-routes.utils';
import { GdsTransparenciesRoutesMapper } from '../../../../utils/gds-transparencies-routes.utils';
import { HeaderReportList } from './HeaderReportList';
import { ReportsDnVueGenerale } from './ReportsDnVueGenerale';

// Non renseigné car souhaité ainsi
const VUE_GENERALE_TITLE = '';

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
      <div className="relative my-8">
        <div className="absolute -top-1 right-0 flex flex-col gap-1">
          <ToggleSwitch
            label={VUE_GENERALE_TITLE}
            checked={isVueGenerale}
            onChange={(checked) => setIsVueGenerale(checked)}
            id="vue-generale-membre"
            showCheckedHint={false}
          />
          <label htmlFor="vue-generale-membre">{isVueGenerale ? 'Tous les dossiers' : 'Mes dossiers'}</label>
        </div>
      </div>
      {isVueGenerale && <ReportsDnVueGenerale />}
      {!isVueGenerale && <ReportList {...props} />}
    </PageContentLayout>
  );
};
export default ReportListPage;
