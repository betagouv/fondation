import Select from '@codegouvfr/react-dsfr/Select';
import type { ChangeEvent, FC } from 'react';
import { NominationFile } from 'shared-models';
import { ReportStateUpdateParam } from '../../../../core-logic/use-cases/report-update/updateReport.use-case';
import { Card } from './Card';
import { ReportVM } from '../../../../VM/ReportVM';

export type ReportOverviewStateProps = {
  state: NominationFile.ReportState;
  onUpdateState: (state: ReportStateUpdateParam) => void;
};

export const ReportOverviewState: FC<ReportOverviewStateProps> = ({
  state,
  onUpdateState
}) => {
  const onChange = (e: ChangeEvent<HTMLSelectElement>) =>
    onUpdateState(e.target.value as ReportStateUpdateParam);

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
          {Object.entries(ReportVM.stateSelectOptions).map(
            ([stateKey, stateLabel]) => (
              <option key={stateKey} value={stateKey}>
                {stateLabel}
              </option>
            )
          )}
        </Select>
      </div>
    </Card>
  );
};
