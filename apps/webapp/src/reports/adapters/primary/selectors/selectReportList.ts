import { Magistrat, NominationFile, Transparency } from "shared-models";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { createAppSelector } from "../../../store/createAppSelector";
import { UnionToTuple } from "type-fest";
import _ from "lodash";

export type ReportListItemVM = {
  id: string;
  folderNumber: number | "Profilé";
  state: ReturnType<typeof stateToLabel>;
  dueDate: string | null;
  formation: ReturnType<typeof formationToLabel>;
  name: string;
  reporterName: string | null;
  transparency: ReturnType<typeof transparencyToLabel>;
  grade: ReturnType<typeof gradeToLabel>;
  targettedPosition: string;
  observersCount: number;
  href: string;
  onClick: () => void;
};

export type ReportListVM = {
  reports: ReportListItemVM[];
};

export const selectReportList = createAppSelector(
  [
    (state) => state.reportList.data,
    (state) => state.router.anchorsAttributes.reportOverview,
    (state) => state.authentication.user,
  ],
  (data, getAnchorAttributes, user): ReportListVM => {
    const transparencyOrder: UnionToTuple<Transparency> = [
      Transparency.AUTOMNE_2024,
      Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024,
      Transparency.PROCUREURS_GENERAUX_25_NOVEMBRE_2024,
      Transparency.TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024,
      Transparency.MARCH_2025,
      Transparency.MARCH_2026,
    ];

    const sortedReports = _.orderBy(
      [...(data || [])],
      [
        (item) => transparencyOrder.indexOf(item.transparency),
        (item) => item.folderNumber,
      ],
    );

    const reports = sortedReports
      .filter(({ reporterName }) =>
        user ? reporterName === user.reporterName : false,
      )
      .map(
        ({
          id,
          folderNumber,
          name,
          reporterName,
          dueDate,
          state,
          formation,
          transparency,
          grade,
          targettedPosition,
          observersCount,
        }) => {
          const { href, onClick } = getAnchorAttributes(id);

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
            reporterName,
            state: stateToLabel(state),
            dueDate: dueDateFormatted,
            formation: formationToLabel(formation),
            name,
            transparency: transparencyToLabel(transparency),
            grade: gradeToLabel(grade),
            targettedPosition,
            observersCount,
            href,
            onClick,
          } as const;
        },
      );

    return {
      reports,
    };
  },
);

export const transparencyToLabel = (transparency: Transparency) => {
  switch (transparency) {
    case Transparency.AUTOMNE_2024:
      return "Octobre 2024";
    case Transparency.MARCH_2025:
      return "Mars 2025";
    case Transparency.MARCH_2026:
      return "Mars 2026";
    case Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024:
      return "PG 8/11/2024";
    case Transparency.PROCUREURS_GENERAUX_25_NOVEMBRE_2024:
      return "PG 25/11/2024";
    case Transparency.TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024:
      return "Tableau général T 25/11/2024";
    default: {
      const _exhaustiveCheck: never = transparency;
      console.info(_exhaustiveCheck);
      throw new Error(
        `Unhandled transparency: ${JSON.stringify(transparency)}`,
      );
    }
  }
};
export const stateToLabel = (state: NominationFile.ReportState) => {
  switch (state) {
    case NominationFile.ReportState.NEW:
      return "Nouveau";
    case NominationFile.ReportState.IN_PROGRESS:
      return "En cours";
    case NominationFile.ReportState.READY_TO_SUPPORT:
      return "Prêt à soutenir";
    case NominationFile.ReportState.OPINION_RETURNED:
      return "Avis restitué";
    default: {
      const _exhaustiveCheck: never = state;
      console.info(_exhaustiveCheck);
      throw new Error(`Unhandled state: ${JSON.stringify(state)}`);
    }
  }
};
export const formationToLabel = (formation: Magistrat.Formation) => {
  switch (formation) {
    case Magistrat.Formation.SIEGE:
      return "Siège";
    case Magistrat.Formation.PARQUET:
      return "Parquet";
    default: {
      const _exhaustiveCheck: never = formation;
      console.info(_exhaustiveCheck);
      throw new Error(`Unhandled formation: ${JSON.stringify(formation)}`);
    }
  }
};
export const gradeToLabel = (grade: Magistrat.Grade) => {
  switch (grade) {
    case Magistrat.Grade.I:
      return "I";
    case Magistrat.Grade.II:
      return "II";
    case Magistrat.Grade.HH:
      return "HH";
    default: {
      const _exhaustiveCheck: never = grade;
      console.info(_exhaustiveCheck);
      throw new Error(`Unhandled grade: ${JSON.stringify(grade)}`);
    }
  }
};
