import { Magistrat } from "shared-models";

export class FormationsRoutesMapper {
  static formationToPathSegmentMap: { [key in Magistrat.Formation]: string } = {
    [Magistrat.Formation.PARQUET]: "parquet",
    [Magistrat.Formation.SIEGE]: "siege",
  };

  static toPathSegment(formation: Magistrat.Formation): string {
    return this.formationToPathSegmentMap[formation];
  }

  static toFormation(pathSegment: string): Magistrat.Formation {
    const formationEnum = Object.entries(this.formationToPathSegmentMap).find(
      ([, value]) => value === pathSegment,
    );

    if (!formationEnum) {
      throw new Error(`Unhandled path segment: ${pathSegment}`);
    }

    return formationEnum[0] as Magistrat.Formation;
  }
}
