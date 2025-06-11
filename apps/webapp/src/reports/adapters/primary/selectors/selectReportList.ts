import { colors } from "@codegouvfr/react-dsfr";
import _ from "lodash";
import { DateOnlyJson, Magistrat } from "shared-models";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { createAppSelector } from "../../../../store/createAppSelector";
import { gradeToLabel } from "../labels/labels-mappers";
import { reportListTableLabels } from "../labels/report-list-table-labels";
import { stateToLabel } from "../labels/state-label.mapper";

export type ReportListItemVM = {
  id: string;
  folderNumber: number | "Profilé";
  state: ReturnType<typeof stateToLabel>;
  dueDate: string | null;
  name: string;
  grade: ReturnType<typeof gradeToLabel>;
  targettedPosition: string;
  observersCount: number;
  href: string;
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
};

export type ReportListVM = {
  newReportsCount: number;
  reports: ReportListItemVM[];
  headers: string[];
  title: { text: string; color?: string }[];
};

export const selectReportList = createAppSelector(
  [
    (state) => state.reportList.data,
    (state) => state.router.anchorsAttributes.reportOverview,
    (
      _,
      args: {
        transparencyFilter: string;
        formationFilter: Magistrat.Formation;
        dateTransparenceFilter: DateOnlyJson;
      },
    ) => args,
  ],
  (data, getReportAnchorAttributes, args): ReportListVM => {
    const { transparencyFilter, formationFilter, dateTransparenceFilter } =
      args;

    const sortedReports = _.orderBy(
      [...(data || [])],
      [(item) => item.folderNumber],
    );

    const reports = sortedReports
      .filter(({ transparency }) => transparency === transparencyFilter)
      .filter(({ formation }) => formation === formationFilter)
      .filter(({ dateTransparence }) =>
        DateOnly.fromStoreModel(dateTransparence).equal(
          DateOnly.fromStoreModel(dateTransparenceFilter),
        ),
      )
      .map(
        ({
          id,
          folderNumber,
          name,
          dueDate,
          state,
          transparency,
          grade,
          targettedPosition,
          observersCount,
          dateTransparence,
          formation,
        }) => {
          const { href, onClick } = getReportAnchorAttributes(
            id,
            transparency,
            formation,
            dateTransparence,
          );

          const dueDateFormatted = dueDate
            ? new DateOnly(
                dueDate.year,
                dueDate.month,
                dueDate.day,
              ).toFormattedString()
            : null;

          return {
            id,
            folderNumber: folderNumber ?? "Profilé",
            state: stateToLabel(state),
            dueDate: dueDateFormatted,
            name,
            grade: gradeToLabel(grade),
            targettedPosition,
            observersCount,
            href,
            onClick,
          } as const;
        },
      );

    return {
      newReportsCount: _.sumBy(reports, (report) =>
        report.state === "Nouveau" ? 1 : 0,
      ),
      headers: Object.values(reportListTableLabels.headers),
      reports,
      title: [
        {
          text: "Rapports sur la ",
        },
        {
          text: `transparence du ${DateOnly.fromStoreModel(dateTransparenceFilter).toFormattedString()} (${transparencyFilter})`,
          color: colors.options.yellowTournesol.sun407moon922.hover,
        },
      ],
    };
  },
);
