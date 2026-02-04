import type { DateOnlyJson } from '@/types/date-only.types';
import type { FormationEnum } from '@/types/enums.types';
import { colors } from '@codegouvfr/react-dsfr';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { DateOnly } from '../../../../models/date-only.model';
import {
  getTransparencesBreadCrumb,
  TransparencesCurrentPage
} from '../../../../utils/transparences-breadcrumb.utils';
import { Breadcrumb } from '../../../shared/Breadcrumb';

export type HeaderReportListProps = {
  dateTransparence: DateOnlyJson;
  transparency: string;
  formation: FormationEnum;
  dueDate: DateOnlyJson | null;
};

export const HeaderReportList: FC<HeaderReportListProps> = ({
  dateTransparence,
  transparency,
  formation,
  dueDate
}) => {
  const navigate = useNavigate();
  const breadcrumb = getTransparencesBreadCrumb(
    {
      formation,
      name: TransparencesCurrentPage.perGdsTransparencyReports
    },
    navigate
  );

  return (
    <div>
      <Breadcrumb
        className="mb-2"
        id="reports-breadcrumb"
        ariaLabel="Fil d'Ariane des rapports"
        breadcrumb={breadcrumb}
      />

      <div className="mb-8">
        <h1 className="mb-0">
          <span>Transparence: </span>
          <span style={{ color: colors.options.yellowTournesol.sun407moon922.hover }}>{transparency}</span>
        </h1>
        <table>
          <tbody>
            <tr>
              <th scope="row" className="text-left" style={{ color: colors.options.grey._625_425.default }}>
                Publication le:
              </th>
              <td>
                <DisplayedDate dateOnly={dateTransparence} />
              </td>
            </tr>
            {dueDate && (
              <tr>
                <th scope="row" className="text-left" style={{ color: colors.options.grey._625_425.default }}>
                  1<sup>è</sup> séance de restitution le:
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

function DisplayedDate(props: { dateOnly: DateOnlyJson | null | undefined }) {
  if (!props.dateOnly) return null;

  const dateOnly = DateOnly.fromStoreModel(props.dateOnly);
  const iso = dateOnly.toFormattedString('yyyy-MM-dd');
  const formatted = dateOnly.toFormattedString('dd/MM/yyyy');

  return (
    <time dateTime={iso} title={iso}>
      {formatted}
    </time>
  );
}
