import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { generatePath } from 'react-router';

import { IconLink } from '@/shared/ui/icon-link';
import { ACTION_ICONS } from '@/shared/ui/icons';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { FoundSessionDocsDto } from '@api/types';

export function DocActionUpdate(props: {
  disabled: boolean;
  doc: FoundSessionDocsDto['items'][number];
  sessionId: string;
}) {
  const { sessionId, doc, disabled } = props;

  const { formatMessage } = useIntl();

  const to = useMemo(() => {
    if (doc.type === 'agenda') {
      return generatePath(ROUTE_PATHS.SG.AGENDA_PREVIEW, {
        agendaId: doc.id,
        sessionId,
      });
    }

    return generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_PREVIEW, {
      officialReportId: doc.id,
      sessionId,
    });
  }, [sessionId, doc]);

  return (
    <IconLink
      disabled={disabled}
      iconId={ACTION_ICONS.edit}
      label={formatMessage({ defaultMessage: 'Modifier {name}' }, { name: doc.name })}
      small
      to={to}
    />
  );
}
