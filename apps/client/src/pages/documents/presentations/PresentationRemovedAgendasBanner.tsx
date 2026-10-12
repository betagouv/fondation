import { FormattedMessage, useIntl } from 'react-intl';

import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { AlertBanner } from '@/shared/ui/alert-banner';
import { formatDateOnly } from '@/utils/date-only.util';
import { timeOnlyToDate } from '@/utils/time-only.util';
import { toInitials } from '@/utils/user.utils';
import type { DetailedPresentationPlanMetadataDto } from '@api/types';
import { useUser } from '@queries/auth.queries';

type RemovedAgenda = DetailedPresentationPlanMetadataDto['removedAgendas'][number];

export function PresentationRemovedAgendasBanner(props: { removedAgendas: readonly RemovedAgenda[] }) {
  return (
    <AlertBanner
      className="justify-center px-4 py-3 text-center"
      icon="fr-icon-info-fill"
      message={
        <span className="flex flex-col">
          {props.removedAgendas.map((removed) => (
            <span key={removed.agenda.id}>
              <RemovedAgendaMessage removed={removed} />
            </span>
          ))}
        </span>
      }
      tone="info"
    />
  );
}

function RemovedAgendaMessage(props: { removed: RemovedAgenda }) {
  const { formatMessage } = useIntl();
  const dateAndTime = useDateAndTime();
  const { user } = useUser();
  const { agenda, removedAt, removedBy, takenBy } = props.removed;

  const values = {
    ...dateAndTime(removedAt),
    agendaDate: formatDateOnly(agenda.sessionMeetingDate),
    agendaInitials: toInitials(agenda.chairman),
    noticeDate: formatDateOnly(takenBy.date),
    noticeInitials: toInitials(takenBy.chairman),
    noticeTime: timeOnlyToDate(takenBy.time),
  };

  if (!removedBy) {
    return (
      <FormattedMessage
        defaultMessage="L'ODJ du {agendaDate} - {agendaInitials} a été retiré de cette notice : il fait partie de la notice NDR {noticeDate}, {noticeTime, time, short} - {noticeInitials}, validée le {date} à {time}."
        values={values}
      />
    );
  }

  return (
    <FormattedMessage
      defaultMessage="L'ODJ du {agendaDate} - {agendaInitials} a été retiré de cette notice : il fait partie de la notice NDR {noticeDate}, {noticeTime, time, short} - {noticeInitials}, validée le {date} à {time} par {remover}."
      values={{
        ...values,
        remover: removedBy.id === user?.id ? formatMessage({ defaultMessage: 'vous' }) : removedBy.name,
      }}
    />
  );
}
