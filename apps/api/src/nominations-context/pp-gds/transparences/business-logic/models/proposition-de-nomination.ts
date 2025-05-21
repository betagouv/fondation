import { DateOnlyJson, Magistrat } from 'shared-models';
import { DossierDeNomination } from 'src/nominations-context/sessions/business-logic/models/dossier-de-nomination';

type ContenuInconnu = Record<string, unknown>;

export interface ContenuPropositionDeNominationTransparence
  extends ContenuInconnu {
  folderNumber: number | null;
  name: string;
  formation: Magistrat.Formation;
  dueDate: DateOnlyJson | null;
  grade: Magistrat.Grade;
  currentPosition: string;
  targettedPosition: string;
  rank: string;
  birthDate: DateOnlyJson;
  biography: string | null;
  observers: string[] | null;
}

export class PropositionDeNominationTransparence {
  constructor(private readonly _dossierDeNomination: DossierDeNomination) {}

  updateFolderNumber(folderNumber: number) {
    this._dossierDeNomination.updateContent({
      folderNumber,
    });
  }

  updateObservers(observers: string[]) {
    this._dossierDeNomination.updateContent({
      observers,
    });
  }
}
