import { Magistrat, Transparency } from "shared-models";

export type TransparencyLabel = ReturnType<typeof transparencyToLabel>;

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
    case Transparency.CABINET_DU_MINISTRE_DU_21_JANVIER_2025:
      return "Cabinet 21/01/2025";
    case Transparency.SIEGE_DU_06_FEVRIER_2025:
      return "Siège 06/02/2025";
    case Transparency.PARQUET_DU_06_FEVRIER_2025:
      return "Parquet 06/02/2025";
    default: {
      const _exhaustiveCheck: never = transparency;
      console.info(_exhaustiveCheck);
      throw new Error(
        `Unhandled transparency: ${JSON.stringify(transparency)}`,
      );
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
