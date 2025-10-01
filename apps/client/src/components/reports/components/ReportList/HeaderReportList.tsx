import { useNavigate } from 'react-router-dom';
import {
  getTransparencesBreadCrumb,
  TransparencesCurrentPage
} from '../../../../utils/transparences-breadcrumb.utils';
import { Breadcrumb } from '../../../shared/Breadcrumb';
import { DateOnly } from '../../../../models/date-only.model';
import { colors } from '@codegouvfr/react-dsfr';
import type { DateOnlyJson, Magistrat } from 'shared-models';
import type { FC } from 'react';

export type HeaderReportListProps = {
  dateTransparence: DateOnlyJson;
  transparency: string;
  formation: Magistrat.Formation;
};

export const HeaderReportList: FC<HeaderReportListProps> = ({
  dateTransparence,
  transparency,
  formation
}) => {
  const navigate = useNavigate();
  const breadcrumb = getTransparencesBreadCrumb(
    {
      name: TransparencesCurrentPage.perGdsTransparencyReports,
      formation
    },
    navigate
  );

  const title = [
    {
      text: 'Rapports sur la '
    },
    {
      text: `transparence du ${DateOnly.fromStoreModel(dateTransparence).toFormattedString()} (${transparency})`,
      color: colors.options.yellowTournesol.sun407moon922.hover
    }
  ];

  return (
    <div>
      <Breadcrumb
        className="mb-2"
        id="reports-breadcrumb"
        ariaLabel="Fil d'Ariane des rapports"
        breadcrumb={breadcrumb}
      />

      <h1>
        {title.map(({ text, color }, index) => (
          <span
            key={index}
            style={{
              color
            }}
          >
            {text}
          </span>
        ))}
      </h1>
    </div>
  );
};
