import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb';
import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';
import { useNavigate } from 'react-router';

import { ROUTE_PATHS } from '../../../../utils/route-path.utils';
import { capitalize } from '../../../../utils/string.utils';

export function DetailsMemberHeader(props: { member: { firstName: string; lastName: string } }) {
  const navigate = useNavigate();
  const onCloseClicked = React.useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className="sticky top-0 flex flex-row items-start justify-between bg-white">
      <Breadcrumb
        currentPageLabel={capitalize(props.member.firstName) + ' ' + props.member.lastName.toUpperCase()}
        segments={[
          {
            label: 'Secrétariat général',
            linkProps: { to: ROUTE_PATHS.SG.DASHBOARD },
          },
          {
            label: 'Gérer les membres',
            linkProps: { to: ROUTE_PATHS.SG.MANAGE_MEMBERS },
          },
        ]}
      />

      {window.history.length > 0 ? (
        <Button
          size="small"
          className="mt-4 flex-grow-0"
          priority="tertiary no outline"
          iconId="fr-icon-close-line"
          iconPosition="right"
          onClick={onCloseClicked}
        >
          Fermer
        </Button>
      ) : null}
    </div>
  );
}
