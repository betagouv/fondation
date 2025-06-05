import { Magistrat } from "shared-models";
import { selectReportList } from "../selectors/selectReportList";
import { useAppSelector } from "./react-redux";

export const useSelectReportsList = (
  transparency: string,
  formation: Magistrat.Formation,
) => {
  const reportListArgs = {
    transparencyFilter: transparency,
    formationFilter: formation,
  };

  return useAppSelector((state) => selectReportList(state, reportListArgs));
};
