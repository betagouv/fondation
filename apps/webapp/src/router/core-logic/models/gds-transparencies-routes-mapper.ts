import { Transparency } from "shared-models";

export class GdsTransparenciesRoutesMapper {
  static transparencyToPathSegmentMap: { [key in Transparency]: string } = {
    [Transparency.AUTOMNE_2024]: "18-10-2024-automne",
    [Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024]: "08-11-2024-pg-pr",
    [Transparency.PROCUREURS_GENERAUX_25_NOVEMBRE_2024]: "25-11-2024",
    [Transparency.TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024]:
      "25-11-2024-mamoudzou",
    [Transparency.CABINET_DU_MINISTRE_DU_21_JANVIER_2025]:
      "21-01-2025-cabinet-gds",
    [Transparency.SIEGE_DU_06_FEVRIER_2025]: "06-02-2025-siege",
    [Transparency.PARQUET_DU_06_FEVRIER_2025]: "06-02-2025-parquet",
    [Transparency.MARCH_2025]: "march-2025",
    [Transparency.MARCH_2026]: "march-2026",
  };

  static toPathSegment(transparency: Transparency): string {
    return this.transparencyToPathSegmentMap[transparency];
  }

  static toTransparency(pathSegment: string): Transparency {
    const transparencyEnum = Object.entries(
      this.transparencyToPathSegmentMap,
    ).find(([, value]) => value === pathSegment);

    if (!transparencyEnum) {
      throw new Error(`Unhandled path segment: ${pathSegment}`);
    }

    return transparencyEnum[0] as Transparency;
  }
}
