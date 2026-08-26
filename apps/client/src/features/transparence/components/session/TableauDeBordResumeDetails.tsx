import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { formatDateOnly } from '@/utils/date-only.util';
import type { PlainDateOnly } from '@/utils/date-only.util';
import type { DetailedNominationSessionDto } from '@api/types';

function Detail(props: { date: PlainDateOnly | null | undefined; label: ReactNode }) {
  return (
    <div className="flex items-baseline gap-x-2">
      <span className="text-sm leading-6 font-normal text-(--text-mention-grey)">{props.label}</span>
      <span className="text-sm leading-6 font-normal text-(--text-default-grey) lining-nums">
        {props.date ? formatDateOnly(props.date) : '-'}
      </span>
    </div>
  );
}

export const TableauDeBordResumeDetails = (transparence: DetailedNominationSessionDto) => {
  const { date, dueDate, observationsClosingDate, positionStartDate } = transparence;

  return (
    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
      <Detail date={date} label={<FormattedMessage defaultMessage="Publiée le" />} />
      <Detail
        date={observationsClosingDate}
        label={<FormattedMessage defaultMessage="Délai d'observation" />}
      />
      <Detail date={dueDate} label={<FormattedMessage defaultMessage="Échéance" />} />
      <Detail date={positionStartDate} label={<FormattedMessage defaultMessage="Prise de poste" />} />
    </div>
  );
};
