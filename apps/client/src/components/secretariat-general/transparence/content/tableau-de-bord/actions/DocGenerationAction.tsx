import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';
import { generatePath } from 'react-router';

import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from '@/components/shared/menu';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { useIsSessionReadyForDocGenerationQuery } from '@queries/agenda.queries';

export function DocGenerationAction(props: { sessionId: string }) {
  const { data: readiness } = useIsSessionReadyForDocGenerationQuery({ sessionId: props.sessionId });

  const [agendaPath, officialReportPath] = React.useMemo(
    () => [
      generatePath(ROUTE_PATHS.SG.AGENDA_NEW, { sessionId: props.sessionId }),
      generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_NEW, { sessionId: props.sessionId })
    ],
    [props.sessionId]
  );

  if (!readiness?.isReady) return null;

  if (readiness.canCreateAgenda && readiness.canCreateOfficialReport) {
    return (
      <li>
        <MenuRoot>
          <MenuTrigger size="small" priority="secondary" iconId="fr-icon-folder-2-line">
            Générer la documentation <i className={cx('ri-arrow-down-s-line')} />
          </MenuTrigger>

          <MenuContent>
            <MenuItem linkProps={{ to: agendaPath }}>Ordre du jour</MenuItem>

            <MenuItem linkProps={{ to: officialReportPath }}>Procès verbal</MenuItem>
          </MenuContent>
        </MenuRoot>
      </li>
    );
  }

  if (readiness.canCreateAgenda) {
    return (
      <li>
        <Button
          size="small"
          priority="secondary"
          iconId="fr-icon-folder-2-line"
          linkProps={{ to: agendaPath }}
        >
          Ordre du jour
        </Button>
      </li>
    );
  }

  return (
    <li>
      <Button
        size="small"
        priority="secondary"
        iconId="fr-icon-folder-2-line"
        linkProps={{ to: officialReportPath }}
      >
        Procès verbal
      </Button>
    </li>
  );
}
