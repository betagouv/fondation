import { Magistrat } from 'shared-models';
import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-imported.event';
import { GdsTransparenceNominationFilesAddedEventPayload } from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-nomination-files-added.event';
import { TypeDeSaisine } from 'shared-models';
import { DossierDeNomination } from 'src/nominations-context/sessions/business-logic/models/dossier-de-nomination';
import { Session } from 'src/nominations-context/sessions/business-logic/models/session';
import { AffectationRapporteursCréeEvent } from 'src/nominations-context/sessions/business-logic/models/events/affectation-rapporteurs-crée.event';
import { AffectationRapporteursModifiéeEvent } from 'src/nominations-context/sessions/business-logic/models/events/affectation-rapporteurs-modifiée.event';
import { NouveauDossierDeNominationEvent } from 'src/nominations-context/sessions/business-logic/models/events/nouveau-dossier-de-nomination.event';
import { PréAnalyse } from 'src/nominations-context/sessions/business-logic/models/pré-analyse';
import { Affectation } from 'src/nominations-context/sessions/business-logic/models/affectation';

export type DossierAvecPayload<T extends boolean = boolean> = {
  dossier: DossierDeNomination;
  nouveauDossierEvent: NouveauDossierDeNominationEvent;
  formation: Magistrat.Formation;
  préAnalyse: PréAnalyse;
  rapporteurIds: T extends true ? string[] : string[] | null;
};

export class GdsTransparenceEventTransformer<T extends boolean = false> {
  constructor(
    private readonly _session: Session,
    private readonly _dossiers: DossierAvecPayload<T>[] = [],
  ) {}

  transformer(
    nominationFiles:
      | GdsNewTransparenceImportedEventPayload['nominationFiles']
      | GdsTransparenceNominationFilesAddedEventPayload['nominationFiles'],
  ): GdsTransparenceEventTransformer {
    const dossiers = nominationFiles.map(({ nominationFileId, content }) => {
      const contenu = {
        biography: content.biography,
        birthDate: content.birthDate,
        currentPosition: content.currentPosition,
        targettedPosition: content.targettedPosition,
        dueDate: content.dueDate,
        folderNumber: content.folderNumber,
        formation: content.formation,
        grade: content.grade,
        name: content.name,
        observers: content.observers,
        rank: content.rank,
      };

      const [dossier, nouveauDossierEvent] = this._session.nouveauDossier(
        nominationFileId,
        contenu,
      );
      const préAnalyse = PréAnalyse.fromTransparenceRulesV1(
        dossier.id,
        content.rules,
      );

      const dossierAvecPayload = {
        dossier,
        nouveauDossierEvent,
        formation: content.formation,
        préAnalyse,
        rapporteurIds: content.reporterIds,
      };
      return dossierAvecPayload;
    });

    return new GdsTransparenceEventTransformer(this._session, dossiers);
  }

  créerAffectationRapporteurs(
    formation: Magistrat.Formation,
    typeDeSaisine: TypeDeSaisine,
  ): readonly [Affectation, AffectationRapporteursCréeEvent] | [null, null] {
    const dossiersFiltrés =
      this.filtrerAvecRapporteurs().filtrerFormation(formation);

    if (dossiersFiltrés.contientDossiers()) {
      const affectation = this._session.affecterRapporteurs(
        dossiersFiltrés.dossiers,
        formation,
      );

      const affectationCréeEvent =
        AffectationRapporteursCréeEvent.fromAffectationSnapshot(
          affectation.snapshot(),
          typeDeSaisine,
        );
      return [affectation, affectationCréeEvent] as const;
    }

    return [null, null] as const;
  }

  mettreàJourAffectationRapporteurs(
    affectation: Affectation,
  ): AffectationRapporteursModifiéeEvent | null {
    const dossiersFiltrés = this.filtrerAvecRapporteurs().filtrerFormation(
      affectation.formation,
    );

    if (!dossiersFiltrés.contientDossiers()) return null;

    dossiersFiltrés.dossiers.forEach(({ dossier, rapporteurIds }) => {
      affectation.ajouterDossier(dossier, rapporteurIds);
    });

    return AffectationRapporteursModifiéeEvent.create({
      id: affectation.id,
      sessionId: this._session.id,
      typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
      formation: affectation.formation,
      affectationsDossiersDeNominations: dossiersFiltrés.dossiers.map(
        ({ dossier, rapporteurIds }) => ({
          dossierDeNominationId: dossier.id,
          rapporteurIds,
        }),
      ),
    });
  }

  filtrerAvecRapporteurs() {
    return new GdsTransparenceEventTransformer<true>(
      this._session,
      this._dossiers.filter(
        (dossierAvecPayload) => dossierAvecPayload.rapporteurIds !== null,
      ) as DossierAvecPayload<true>[],
    );
  }

  filtrerFormation(formation: Magistrat.Formation) {
    return new GdsTransparenceEventTransformer<T>(
      this._session,
      this._dossiers.filter(
        (dossierAvecPayload) => dossierAvecPayload.formation === formation,
      ),
    );
  }

  contientDossiers() {
    return this._dossiers.length > 0;
  }

  get dossiers() {
    return this._dossiers;
  }
}
