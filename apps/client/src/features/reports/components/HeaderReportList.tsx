import Badge from '@codegouvfr/react-dsfr/Badge';
import { FormattedMessage, useIntl } from 'react-intl';

import { type FormationEnum, FormationEnumMessages } from '@/shared/enums/formation.enum';
import { Collapse } from '@/shared/ui/collapse';
import {
  dateOnlyToIso,
  formatDateOnly,
  formatLongDateOnly,
  type PlainDateOnly,
} from '@/utils/date-only.util';

export function HeaderReportList({
  dateTransparence,
  dueDate,
  formation,
  transparency,
}: {
  dateTransparence: PlainDateOnly;
  dueDate: PlainDateOnly | null;
  formation: FormationEnum;
  transparency: string;
}) {
  const intl = useIntl();

  return (
    <div>
      <h1 className="fr-h4 fr-mb-0 flex flex-wrap items-center gap-x-3">
        <Badge as="span" className="shrink-0">
          {intl.formatMessage(FormationEnumMessages[formation])}
        </Badge>
        <span className="text-(--text-title-blue-france)">{transparency}</span>
        <span aria-hidden className="text-(--text-title-blue-france)">
          -
        </span>
        <time className="text-(--text-default-grey)" dateTime={dateOnlyToIso(dateTransparence)}>
          {formatLongDateOnly(dateTransparence)}
        </time>
      </h1>
      <Collapse>
        <dl className="fr-pt-3v m-0 p-0 text-sm leading-6 empty:hidden">
          {dueDate && (
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
      </Collapse>
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
