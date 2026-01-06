import Select from '@codegouvfr/react-dsfr/Select';
import type { ChangeEvent, FC } from 'react';
import { NominationFile } from 'shared-models';

import { Card } from './Card';
import { ReportVM } from '../../../../VM/ReportVM';
import type { DetailedReportDto } from '@api/types';

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
        <Select
          label={ReportVM.stateSelectLabel}
          nativeSelectProps={{
            value: state,
            onChange
          }}
        >
          {Object.entries(ReportVM.stateSelectOptions).map(([stateKey, stateLabel]) => (
            <option key={stateKey} value={stateKey}>
              {stateLabel}
            </option>
          ))}
        </Select>
      </div>
    </Card>
  );
};
