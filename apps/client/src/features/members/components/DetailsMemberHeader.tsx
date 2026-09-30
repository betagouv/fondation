import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb';
import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation, useNavigate } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';

export function DetailsMemberHeader(props: { member: { firstName: string; lastName: string } }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const onCloseClicked = React.useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className="sticky top-0 z-10 flex flex-row items-start justify-between bg-(--background-default-grey)">
      <Breadcrumb
        currentPageLabel={capitalize(props.member.firstName) + ' ' + props.member.lastName.toUpperCase()}
        segments={[
          {
            label: formatMessage({ defaultMessage: 'Secrétariat général' }),
            linkProps: { to: ROUTE_PATHS.SG.DASHBOARD },
          },
          {
            label: formatMessage({ defaultMessage: 'Gérer les membres' }),
            linkProps: { to: ROUTE_PATHS.SG.MANAGE_MEMBERS },
          },
        ]}
      />

      {location.key !== 'default' ? (
        <Button
          className="fr-mt-4v grow-0"
          iconId="fr-icon-close-line"
          iconPosition="right"
          onClick={onCloseClicked}
          priority="tertiary no outline"
          size="small"
        >
          <FormattedMessage defaultMessage="Fermer" />
        </Button>
      ) : null}
    </div>
  );
}
