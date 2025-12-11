import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb';
import { ROUTE_PATHS } from '../../../../utils/route-path.utils';
import { capitalize } from '../../../../utils/string.utils';

export function DetailsMemberHeader(props: { member: { firstName: string; lastName: string } }) {
  return (
    <div>
      <Breadcrumb
        currentPageLabel={capitalize(props.member.firstName) + ' ' + props.member.lastName.toUpperCase()}
        segments={[
          {
            label: 'Secrétariat général',
            linkProps: { to: ROUTE_PATHS.SG.DASHBOARD }
          },
          {
            label: 'Gérer les membres',
            linkProps: { to: ROUTE_PATHS.SG.MANAGE_MEMBERS }
          }
        ]}
      />
    </div>
  );
}
