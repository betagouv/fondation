import { Transparency } from "shared-models";

export class GdsTransparenciesRoutesMapper {
  static transparencyToPathSegmentMap: { [key in Transparency]: string } = {
    [Transparency.AUTOMNE_2024]: "automne-2024",
    [Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024]:
      "procureurs-generaux-8-novembre-2024",
    [Transparency.PROCUREURS_GENERAUX_25_NOVEMBRE_2024]:
      "procureurs-generaux-25-novembre-2024",
    [Transparency.TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024]:
      "tableau-general-t-du-25-novembre-2024",
    [Transparency.CABINET_DU_MINISTRE_DU_21_JANVIER_2025]:
      "cabinet-du-ministre-du-21-janvier-2025",
    [Transparency.SIEGE_DU_06_FEVRIER_2025]: "siege-du-06-fevrier-2025",
    [Transparency.PARQUET_DU_06_FEVRIER_2025]: "parquet-du-06-fevrier-2025",
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
