import { Transparency } from "shared-models";
import { UnionToTuple } from "type-fest";

export const transparenciesOrder = [
  Transparency.AUTOMNE_2024,
  Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024,
  Transparency.PROCUREURS_GENERAUX_25_NOVEMBRE_2024,
  Transparency.TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024,
  Transparency.CABINET_DU_MINISTRE_DU_21_JANVIER_2025,
  Transparency.SIEGE_DU_06_FEVRIER_2025,
  Transparency.PARQUET_DU_06_FEVRIER_2025,
  Transparency.PARQUET_DU_20_FEVRIER_2025,
  Transparency.DU_03_MARS_2025,
  Transparency.GRANDE_TRANSPA_DU_21_MARS_2025,
  Transparency.DU_30_AVRIL_2025,
  Transparency.MARCH_2026,
].reverse() as UnionToTuple<Transparency>;
