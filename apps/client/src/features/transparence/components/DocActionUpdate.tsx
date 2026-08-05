import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';
import { generatePath } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { FoundSessionDocsDto } from '@api/types';

export function DocActionUpdate(props: {
  sessionId: string;
  doc: FoundSessionDocsDto['items'][number];
  disabled: boolean;
}) {
  const { sessionId, doc, disabled } = props;

  const to = React.useMemo(() => {
    if (doc.type === 'agenda') {
      return generatePath(ROUTE_PATHS.SG.AGENDA_PREVIEW, { sessionId, agendaId: doc.id });
    }

    return generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_PREVIEW, { sessionId, officialReportId: doc.id });
  }, [sessionId, doc]);

  return (
    <Button
      size="small"
      iconId="fr-icon-edit-fill"
      priority="tertiary no outline"
      className="rounded-full"
      title={`Modifier "${doc.name}"`}
      linkProps={{ to }}

      // issue with <Button /> typings
      disabled={disabled as never}
    />
  );
}
