import { Magistrat, Transparency } from "shared-models";
import { selectReportList } from "../selectors/selectReportList";
import { useAppSelector } from "./react-redux";

export const useSelectReportsList = (
  transparency: Transparency | null,
  formation: Magistrat.Formation | null,
) => {
  const reportListArgs = {
    transparencyFilter: transparency || undefined,
    formationFilter: formation || undefined,
  };

  return useAppSelector((state) => selectReportList(state, reportListArgs));
};
