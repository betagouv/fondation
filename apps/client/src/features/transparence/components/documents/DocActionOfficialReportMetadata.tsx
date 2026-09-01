import { useIntl } from 'react-intl';
import { generatePath } from 'react-router';

import { ACTION_ICONS } from '@/constants/icons.constants';
import { IconLink } from '@/shared/ui/icon-link';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

export function DocActionOfficialReportMetadata(props: {
  disabled: boolean;
  sessionId: string;
  officialReport: { id: string; name: string; type: 'officialReport' };
  className?: string;
}) {
  const { formatMessage } = useIntl();
  const to = generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_UPDATE, {
    sessionId: props.sessionId,
    officialReportId: props.officialReport.id,
  });
  const label = formatMessage(
    { defaultMessage: `Modifier les métadonnées de {name}` },
    { name: props.officialReport.name },
  );

  return (
    <div className={props.className}>
      <IconLink small to={to} label={label} disabled={props.disabled} iconId={ACTION_ICONS.agendaMetadata} />
    </div>
  );
}
