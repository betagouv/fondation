import { DateOnlyJson, Magistrat } from "shared-models";
import { selectReportList } from "../selectors/selectReportList";
import { useAppSelector } from "./react-redux";

export const useSelectReportsList = (
  transparency: string,
  formation: Magistrat.Formation,
  dateTransparence: DateOnlyJson,
) => {
  const reportListArgs = {
    transparencyFilter: transparency,
    formationFilter: formation,
    dateTransparenceFilter: dateTransparence,
  };

  return useAppSelector((state) => selectReportList(state, reportListArgs));
};
