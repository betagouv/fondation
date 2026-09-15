import Select from '@codegouvfr/react-dsfr/Select';
import type { ChangeEvent, ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { DetailsLink } from '@/shared/components/details-link';
import { LolfiLink } from '@/shared/components/lolfi-link';
import { PriorityBadge } from '@/shared/components/priority-badge';
import { TitleNameIcons } from '@/shared/components/title-name-icons';
import {
  REPORT_STATUSES,
  type ReportStatusEnum,
  ReportStatusEnumMessages,
} from '@/shared/enums/report-status.enum';
import { DetailsHeader } from '@/shared/ui/details';
import { getDetailSessionGdsPath, openedDossierSearch } from '@/utils/route-path.utils';
import { fullNameCapitalized } from '@/utils/user.utils';
import type { DetailedReportDto } from '@api/types';

export function ReportDetailsHeader(props: {
  breadcrumb?: ReactNode;
  detectedMagistrat: DetailedReportDto['detectedMagistrat'];
  detectedMagistratId: string | null;
  isReadOnly?: boolean;
  name: string;
  nominationFileId: string;
  onUpdateState: (state: ReportStatusEnum) => void;
  priorities: DetailedReportDto['priorities'];
  sessionId: string;
  state: ReportStatusEnum;
}) {
  const { formatMessage } = useIntl();

  const title = props.detectedMagistrat ? fullNameCapitalized(props.detectedMagistrat) : props.name;

  const onChange = (event: ChangeEvent<HTMLSelectElement>) =>
    props.onUpdateState(event.target.value as ReportStatusEnum);

  return (
    <DetailsHeader
      action={
        <Select
          className="fr-mb-0"
          disabled={props.isReadOnly}
          label={formatMessage({ defaultMessage: 'Statut du rapport' })}
          nativeSelectProps={{ onChange, value: props.state }}
        >
          {REPORT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {formatMessage(ReportStatusEnumMessages[status])}
            </option>
          ))}
        </Select>
      }
      backTo={{
        pathname: getDetailSessionGdsPath({ sessionId: props.sessionId }),
        search: openedDossierSearch(props.nominationFileId),
      }}
      breadcrumb={props.breadcrumb}
      overline={<FormattedMessage defaultMessage="Rapport" />}
      title={
        <TitleNameIcons name={title}>
          {props.priorities.length > 0 && (
            <span className="fr-ml-2v fr-mr-3v inline-flex items-center gap-2">
              {[...new Set(props.priorities)].sort().map((priority) => (
                <PriorityBadge key={priority} priority={priority} />
              ))}
            </span>
          )}
          <DetailsLink context="membre" magistratId={props.detectedMagistratId} small />
          <LolfiLink
            name={props.name}
            nominationFileId={props.nominationFileId}
            sessionId={props.sessionId}
            small
          />
        </TitleNameIcons>
      }
    />
  );
}
