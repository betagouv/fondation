import { colors } from '@codegouvfr/react-dsfr';
import { format } from 'date-fns';
import type { FC } from 'react';
import { useNavigate } from 'react-router';

import {
  getTransparencesBreadCrumb,
  TransparencesCurrentPage,
} from '../../../../utils/transparences-breadcrumb.utils';
import { Breadcrumb } from '../../../shared/Breadcrumb';
import type { FormationEnum } from '@/types/enums.types';
import { dateOnlyToDate, type PlainDateOnly } from '@/utils/date-only.util';

export type HeaderReportListProps = {
  dateTransparence: PlainDateOnly;
  transparency: string;
  formation: FormationEnum;
  dueDate: PlainDateOnly | null;
};

export const HeaderReportList: FC<HeaderReportListProps> = ({
  dateTransparence,
  transparency,
  formation,
  dueDate,
}) => {
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
        className="fr-mb-2v"
        id="reports-breadcrumb"
        ariaLabel="Fil d'Ariane des rapports"
        breadcrumb={breadcrumb}
      />

      <div>
        <h1 className="fr-mb-0">
          <span>Transparence: </span>
          <span style={{ color: colors.options.yellowTournesol.sun407moon922.hover }}>{transparency}</span>
        </h1>
        <table>
          <tbody>
            <tr>
              <th
                scope="row"
                className="text-left"
                style={{ color: colors.decisions.text.disabled.grey.default }}
              >
                Publication le:
              </th>
              <td>
                <DisplayedDate dateOnly={dateTransparence} />
              </td>
            </tr>
            {dueDate && (
              <tr>
                <th
                  scope="row"
                  className="text-left"
                  style={{ color: colors.decisions.text.disabled.grey.default }}
                >
                  1<sup>è</sup> séance le:
                </th>
                <td>
                  <DisplayedDate dateOnly={dueDate} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function DisplayedDate(props: { dateOnly: PlainDateOnly | null | undefined }) {
  if (!props.dateOnly) return null;

  const date = dateOnlyToDate(props.dateOnly);
  const iso = format(date, 'yyyy-MM-dd');
  const formatted = format(date, 'dd/MM/yyyy');

  return (
    <time dateTime={iso} title={iso}>
      {formatted}
    </time>
  );
}
