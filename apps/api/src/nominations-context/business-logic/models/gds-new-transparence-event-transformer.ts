import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';
import { DossierDeNomination } from './dossier-de-nomination';
import { Session } from './session';
import { PréAnalyse } from './pré-analyse';
import { NouveauDossierDeNominationEvent } from './events/nouveau-dossier-de-nomination.event';
import { GdsTransparenceNominationFilesAddedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-nomination-files-added.event';

export type DossierAvecPayload<T extends boolean = boolean> = {
  dossier: DossierDeNomination;
  nouveauDossierEvent: NouveauDossierDeNominationEvent;
  préAnalyse: PréAnalyse;
  rapporteurIds: T extends true ? string[] : string[] | null;
};

export class GdsNewTransparenceEventTransformer<T extends boolean = false> {
  constructor(
    private readonly _session: Session,
    private readonly _dossiers: DossierAvecPayload<T>[] = [],
  ) {}

  transformer(
    nominationFiles:
      | GdsNewTransparenceImportedEventPayload['nominationFiles']
      | GdsTransparenceNominationFilesAddedEventPayload['nominationFiles'],
  ): GdsNewTransparenceEventTransformer {
    const dossiers = nominationFiles.map((nominationFile) => {
      const content = {
        biography: nominationFile.biography,
        birthDate: nominationFile.birthDate,
        currentPosition: nominationFile.currentPosition,
        targettedPosition: nominationFile.targettedPosition,
        dueDate: nominationFile.dueDate,
        folderNumber: nominationFile.folderNumber,
        formation: nominationFile.formation,
        grade: nominationFile.grade,
        name: nominationFile.name,
        observers: nominationFile.observers,
        rank: nominationFile.rank,
      };

      const [dossier, nouveauDossierEvent] =
        this._session.nouveauDossier(content);
      const préAnalyse = PréAnalyse.fromTransparenceRulesV1(
        dossier.id,
        nominationFile.rules,
      );

      const dossierAvecPayload = {
        dossier,
        nouveauDossierEvent,
        préAnalyse,
        rapporteurIds: nominationFile.reporterIds,
      };
      return dossierAvecPayload;
    });

    return new GdsNewTransparenceEventTransformer(this._session, dossiers);
  }

  filtrerAvecRapporteurs() {
    return new GdsNewTransparenceEventTransformer<true>(
      this._session,
      this._dossiers.filter(
        (dossierAvecPayload) => dossierAvecPayload.rapporteurIds !== null,
      ) as DossierAvecPayload<true>[],
    );
  }

  get dossiers() {
    return this._dossiers;
  }
}
