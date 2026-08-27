import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router';

import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { type FormationEnum, FormationEnumLabel } from '@/types/enums.types';
import {
  dateOnlyToIso,
  formatDateOnly,
  formatLongDateOnly,
  type PlainDateOnly,
} from '@/utils/date-only.util';
import { getTransparencesBreadCrumb, TransparencesCurrentPage } from '@/utils/transparences-breadcrumb.utils';

export function HeaderReportList({
  dateTransparence,
  transparency,
  formation,
  dueDate,
}: {
  dateTransparence: PlainDateOnly;
  transparency: string;
  formation: FormationEnum;
  dueDate: PlainDateOnly | null;
}) {
  const intl = useIntl();
  const navigate = useNavigate();
  const breadcrumb = getTransparencesBreadCrumb(
    {
      formation,
      name: TransparencesCurrentPage.perGdsTransparencyReports,
    },
    navigate,
  );

  return (
    <div>
      <Breadcrumb
        ariaLabel={intl.formatMessage({ defaultMessage: "Fil d'Ariane des rapports" })}
        breadcrumb={breadcrumb}
        className="fr-mt-0 fr-mb-8v"
        id="reports-breadcrumb"
      />

      <div>
        <h1 className="fr-mb-3v flex flex-wrap items-center gap-x-3 text-[1.75rem] leading-9 font-bold">
          <span className="fr-p-1v shrink-0 rounded-sm bg-(--background-contrast-grey) text-xs font-semibold text-(--text-mention-grey) uppercase">
            {FormationEnumLabel[formation]}
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
      </div>
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
