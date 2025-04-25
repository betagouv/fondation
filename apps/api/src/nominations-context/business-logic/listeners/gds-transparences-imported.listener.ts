import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';
import { TypeDeSaisine } from '../models/type-de-saisine';
import {
  ImportNouvelleTransparenceCommand,
  ImportNouvelleTransparenceUseCase,
} from '../use-cases/import-nouvelle-transparence/import-nouvelle-transparence.use-case';
import { AffectationRapporteursTransparenceTsvUseCase } from '../use-cases/affectation-rapporteurs-transparence-tsv/affectation-rapporteurs-transparence-tsv.use-case';

export class GdsTransparencesImportedListener {
  constructor(
    private readonly nouvelleTransparenceUseCase: ImportNouvelleTransparenceUseCase,
    private readonly affectationRapporteursTransparenceTsvUseCase: AffectationRapporteursTransparenceTsvUseCase,
  ) {}

  async handle(payload: GdsNewTransparenceImportedEventPayload) {
    const command = new ImportNouvelleTransparenceCommand(
      TypeDeSaisine.TRANSPARENCE_GDS,
      payload.transparenceId,
      payload.formations,
    );
    await this.nouvelleTransparenceUseCase.execute(command);
    await this.affectationRapporteursTransparenceTsvUseCase.execute(payload);
  }
}
