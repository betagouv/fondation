import { FormattedMessage, useIntl } from 'react-intl';

import { type FormationEnum, FormationEnumMessages } from '@/shared/enums/formation.enum';
import {
  dateOnlyToIso,
  formatDateOnly,
  formatLongDateOnly,
  type PlainDateOnly,
} from '@/utils/date-only.util';

export function HeaderReportList({
  dateTransparence,
  dense,
  dueDate,
  formation,
  transparency,
}: {
  dateTransparence: PlainDateOnly;
  dense?: boolean;
  dueDate: PlainDateOnly | null;
  formation: FormationEnum;
  transparency: string;
}) {
  const intl = useIntl();

  return (
    <div>
      <h1 className="fr-mb-3v flex flex-wrap items-center gap-x-3 text-2xl font-bold">
        <span className="fr-p-1v shrink-0 rounded-sm bg-(--background-contrast-grey) text-xs font-semibold text-(--text-mention-grey) uppercase">
          {intl.formatMessage(FormationEnumMessages[formation])}
        </span>
        <span className="text-(--text-title-blue-france)">{transparency}</span>
        <span aria-hidden className="text-(--text-title-blue-france)">
          -
        </span>
        <time className="text-(--text-default-grey)" dateTime={dateOnlyToIso(dateTransparence)}>
          {formatLongDateOnly(dateTransparence)}
        </time>
      </h1>
      <dl className="m-0 p-0 text-sm leading-6">
        {!dense && dueDate && (
          <div className="flex gap-x-2">
            <dt className="p-0 text-(--text-mention-grey)">
              <FormattedMessage
                defaultMessage="1<sup>è</sup> séance le"
                values={{ sup: (chunks) => <sup>{chunks}</sup> }}
              />
            </dt>
            <dd className="m-0 p-0 text-(--text-default-grey)">
              <DisplayedDate dateOnly={dueDate} />
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function DisplayedDate(props: { dateOnly: PlainDateOnly | null | undefined }) {
  if (!props.dateOnly) return null;

  const iso = dateOnlyToIso(props.dateOnly);

  return (
    <time dateTime={iso} title={iso}>
      {formatDateOnly(props.dateOnly)}
    </time>
  );
}
