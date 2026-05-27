import Select from '@codegouvfr/react-dsfr/Select';
import type { ChangeEvent, FC } from 'react';

import { useArchivedSession } from '@/hooks/archive/useArchivedSession';
import { REPORT_STATUS_ENUM_LABEL, type ReportStatusEnum } from '@/types/enums.types';
import type { DetailedReportDto } from '@api/types';

import { Card } from './Card';

export type ReportOverviewStateProps = {
  state: DetailedReportDto['state'];
  onUpdateState: (state: ReportStatusEnum) => void;
};

export const ReportOverviewState: FC<ReportOverviewStateProps> = ({ state, onUpdateState }) => {
  const { isArchived } = useArchivedSession();
  const onChange = (e: ChangeEvent<HTMLSelectElement>) => onUpdateState(e.target.value as ReportStatusEnum);

  return (
    <Card>
      <div className="flex">
        <Select
          label="Statut du rapport"
          nativeSelectProps={{ value: state, onChange }}
          disabled={isArchived}
        >
          {Object.entries(REPORT_STATUS_ENUM_LABEL).map(([status, label]) => (
            <option key={status} value={status}>
              {label}
            </option>
          ))}
        </Select>
      </div>
    </Card>
  );
};
