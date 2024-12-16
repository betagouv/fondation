import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import Select from "@codegouvfr/react-dsfr/Select";
import clsx from "clsx";
import { ChangeEvent, FC } from "react";
import { reportsFilteredByState } from "../../../../core-logic/reducers/reportList.slice";
import { useAppDispatch } from "../../hooks/react-redux";
import {
  ReportListStateFilter,
  reportListFilters,
} from "../../labels/report-list-state-filter-labels.mapper";
import { ReportListVM } from "../../selectors/selectReportList";

export type ReportListFiltersProps = {
  filters: ReportListVM["filters"];
};

export const ReportListFilters: FC<ReportListFiltersProps> = ({ filters }) => {
  const dispatch = useAppDispatch();

  const { state } = filters;

  const onChange = (e: ChangeEvent<HTMLSelectElement>) =>
    dispatch(reportsFilteredByState(e.target.value as ReportListStateFilter));

  return (
    <div className={clsx("flex", cx("fr-mb-4v"))}>
      <Select
        label={reportListFilters.state.title}
        nativeSelectProps={{
          value: state,
          onChange,
        }}
      >
        {Object.entries(reportListFilters.state.labels).map(
          ([stateKey, stateLabel]) => (
            <option key={stateKey} value={stateKey}>
              {stateLabel}
            </option>
          ),
        )}
      </Select>
    </div>
  );
};
