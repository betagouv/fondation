import { Magistrat } from 'shared-models';
import { z } from 'zod';

export class FormationsRoutesMapper {
  static formationToPathSegmentMap: { [key in Magistrat.Formation]: string } = {
    [Magistrat.Formation.PARQUET]: 'parquet',
    [Magistrat.Formation.SIEGE]: 'siege'
  };

  static toPathSegment(formation: Magistrat.Formation): string {
    return this.formationToPathSegmentMap[formation];
  }

  static toFormation(pathSegment: string): Magistrat.Formation {
    return z.nativeEnum(Magistrat.Formation).parse(z.string().parse(pathSegment).toUpperCase());
  }
}
