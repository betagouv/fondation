import Select from "@codegouvfr/react-dsfr/Select";
import { ChangeEvent, FC } from "react";
import { NominationFile } from "shared-models";
import { ReportStateUpdateParam } from "../../../../core-logic/use-cases/report-update/updateReport.use-case";
import { ReportVM } from "../../../../core-logic/view-models/ReportVM";
import { Card } from "./Card";

export type ReportOverviewStateProps = {
  state: NominationFile.ReportState;
  onUpdateState: (state: ReportStateUpdateParam) => void;
};

export const ReportOverviewState: FC<ReportOverviewStateProps> = ({
  state,
  onUpdateState,
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
            onChange,
          }}
        >
          {Object.entries(ReportVM.stateSelectOptions).map(
            ([stateKey, stateLabel]) => (
              <option key={stateKey} value={stateKey}>
                {stateLabel}
              </option>
            ),
          )}
        </Select>
      </div>
    </Card>
  );
};
