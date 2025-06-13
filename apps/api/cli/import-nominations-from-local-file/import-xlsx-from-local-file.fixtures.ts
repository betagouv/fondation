import { Magistrat } from 'shared-models';
import { ImportNouvelleTransparenceXlsxNestDto } from 'src/data-administration-context/transparence-xlsx/adapters/primary/nestjs/dto/import-nouvelle-transparence.nest-dto';

export const uneTransparenceSiege: ImportNouvelleTransparenceXlsxNestDto = {
  formation: Magistrat.Formation.SIEGE,
  nomTransparence: 'Transparence Annuelle Siege',
  dateTransparence: '2025-06-27',
  dateEcheance: '2025-06-28',
  datePriseDePosteCible: '2025-05-29',
  dateClotureDelaiObservation: '2025-06-30',
};
