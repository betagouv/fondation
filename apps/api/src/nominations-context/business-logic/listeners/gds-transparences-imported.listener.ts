import { NominationFilesImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/nomination-file-imported.event';
import { TypeDeSaisine } from '../models/type-de-saisine';
import {
  ImportNouvelleTransparenceCommand,
  ImportNouvelleTransparenceUseCase,
} from '../use-cases/import-nouvelle-transparence/import-nouvelle-transparence.use-case';
import _ from 'lodash';

export class GdsTransparencesImportedListener {
  constructor(
    private readonly nouvelleTransparenceUseCase: ImportNouvelleTransparenceUseCase,
  ) {}

  async handle(payload: NominationFilesImportedEventPayload) {
    const transparences = _.uniqBy(payload, (p) => p.content.transparency);

    for (const transparence of transparences) {
      const command = new ImportNouvelleTransparenceCommand(
        TypeDeSaisine.TRANSPARENCE_GDS,
        transparence.content.transparency,
        [transparence.content.formation],
      );
      this.nouvelleTransparenceUseCase.execute(command);
    }
  }
}
