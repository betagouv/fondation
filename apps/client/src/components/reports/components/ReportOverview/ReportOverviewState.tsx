import Select from '@codegouvfr/react-dsfr/Select';
import type { ChangeEvent, FC } from 'react';
import { NominationFile } from 'shared-models';

import type { DetailedReportDto } from '@api/types';
import { stateToLabel } from '../../labels/state-label.mapper';
import { Card } from './Card';

export type ReportOverviewStateProps = {
  state: DetailedReportDto['state'];
  onUpdateState: (state: NominationFile.ReportState) => void;
};

export const ReportOverviewState: FC<ReportOverviewStateProps> = ({ state, onUpdateState }) => {
  const onChange = (e: ChangeEvent<HTMLSelectElement>) =>
    onUpdateState(e.target.value as NominationFile.ReportState);

  return (
    <Card>
      <div className="flex">
        <Select label="Statut du rapport" nativeSelectProps={{ value: state, onChange }}>
          {Object.values(NominationFile.ReportState).map((status) => (
            <option key={status} value={status}>
              {stateToLabel(status)}
            </option>
          ))}
        </Select>
      </div>
    </Card>
  );
};
