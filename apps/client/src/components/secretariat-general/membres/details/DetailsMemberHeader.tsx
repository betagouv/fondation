import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb';
import { ROUTE_PATHS } from '../../../../utils/route-path.utils';
import { capitalize } from '../../../../utils/string.utils';

export function DetailsMemberHeader(props: { user: { firstName: string; lastName: string } }) {
  return (
    <div>
      <Breadcrumb
        currentPageLabel={capitalize(props.user.firstName) + ' ' + props.user.lastName.toUpperCase()}
        segments={[
          {
            label: 'Secrétariat général',
            linkProps: { href: ROUTE_PATHS.SG.DASHBOARD }
          },
          {
            label: 'Gérer les membres',
            linkProps: { href: ROUTE_PATHS.SG.MANAGE_MEMBERS }
          }
        ]}
      />
    </div>
  );
}
