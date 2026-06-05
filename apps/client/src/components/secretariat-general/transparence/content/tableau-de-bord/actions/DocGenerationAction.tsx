import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';
import { generatePath } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useIsSessionReadyForDocGenerationQuery } from '@queries/agenda.queries';

export function DocGenerationAction(props: { sessionId: string }) {
  const { data: readiness } = useIsSessionReadyForDocGenerationQuery({
    sessionId: props.sessionId,
  });

  const officialReportPath = React.useMemo(
    () => generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_NEW, { sessionId: props.sessionId }),
    [props.sessionId],
  );

  if (!readiness?.canCreateOfficialReport) return null;

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
