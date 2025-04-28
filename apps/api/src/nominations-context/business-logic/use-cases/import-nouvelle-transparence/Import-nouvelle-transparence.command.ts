import { Magistrat } from 'shared-models';
import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';
import { TypeDeSaisine } from '../../models/type-de-saisine';

export class ImportNouvelleTransparenceCommand {
  constructor(
    private readonly _typeDeSaisine: TypeDeSaisine,
    private readonly _transparenceId: string,
    private readonly _formations: Magistrat.Formation[],
    private readonly _nominationFilesPayload: GdsNewTransparenceImportedEventPayload['nominationFiles'],
  ) {}

  get typeDeSaisine(): TypeDeSaisine {
    return this._typeDeSaisine;
  }
  get formations(): Magistrat.Formation[] {
    return this._formations;
  }
  get transparenceId(): string {
    return this._transparenceId;
  }
  get nominationFilesPayload(): GdsNewTransparenceImportedEventPayload['nominationFiles'] {
    return this._nominationFilesPayload;
  }

  static create(arg: {
    typeDeSaisine: TypeDeSaisine;
    transparenceId: string;
    formations: Magistrat.Formation[];
    nominationFilesPayload: GdsNewTransparenceImportedEventPayload['nominationFiles'];
  }): ImportNouvelleTransparenceCommand {
    return new ImportNouvelleTransparenceCommand(
      arg.typeDeSaisine,
      arg.transparenceId,
      arg.formations,
      arg.nominationFilesPayload,
    );
  }
}
