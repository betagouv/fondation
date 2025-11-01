import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb';
import { ROUTE_PATHS } from '../../../../utils/route-path.utils';

export function MemberListHeader() {
  return (
    <div>
      <Breadcrumb
        currentPageLabel="Gérer les membres"
        segments={[
          {
            label: 'Secrétariat général',
            linkProps: { href: ROUTE_PATHS.SG.DASHBOARD }
          }
        ]}
      />
    </div>
  );
}
