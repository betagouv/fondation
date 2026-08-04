import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath } from 'react-router';

import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from '@/shared/ui/menu';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useIsSessionReadyForDocGenerationQuery } from '@queries/agenda.queries';

export function DocGenerationMenu(props: { sessionId: string }) {
  const { formatMessage } = useIntl();
  const { data: readiness } = useIsSessionReadyForDocGenerationQuery({ sessionId: props.sessionId });

  const officialReportPath = React.useMemo(
    () => generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_NEW, { sessionId: props.sessionId }),
    [props.sessionId],
  );

  const canCreateOfficialReport = !!readiness?.canCreateOfficialReport;

  return (
    <MenuRoot>
      <MenuTrigger iconId="fr-icon-folder-2-line" priority="tertiary no outline" size="small">
        <FormattedMessage defaultMessage="Générer la documentation" />
        <i aria-hidden className="fr-icon-arrow-down-s-line fr-icon--sm fr-ml-1v" />
      </MenuTrigger>

      <MenuContent>
        {canCreateOfficialReport ? (
          <MenuItem iconId="ri-file-text-line" linkProps={{ to: officialReportPath }}>
            <FormattedMessage defaultMessage="Procès verbal" />
          </MenuItem>
        ) : (
          <MenuItem
            disabled
            iconId="ri-file-text-line"
            title={formatMessage({
              defaultMessage: 'Tous les dossiers doivent avoir une issue pour générer le procès verbal',
            })}
          >
            <FormattedMessage defaultMessage="Procès verbal" />
          </MenuItem>
        )}
      </MenuContent>
    </MenuRoot>
  );
}
