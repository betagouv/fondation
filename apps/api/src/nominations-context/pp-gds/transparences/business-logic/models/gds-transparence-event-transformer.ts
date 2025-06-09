import { DateOnlyJson, Magistrat, TypeDeSaisine } from 'shared-models';
import { GdsNewTransparenceImportedEventPayload as GdsNewTransparenceImportedEventPayloadTsv } from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-imported.event';
import { GdsTransparenceNominationFilesAddedEventPayload } from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-nomination-files-added.event';
import { Affectation } from 'src/nominations-context/sessions/business-logic/models/affectation';
import { DossierDeNomination } from 'src/nominations-context/sessions/business-logic/models/dossier-de-nomination';
import { AffectationRapporteursCréeEvent } from 'src/nominations-context/sessions/business-logic/models/events/affectation-rapporteurs-crée.event';
import { AffectationRapporteursModifiéeEvent } from 'src/nominations-context/sessions/business-logic/models/events/affectation-rapporteurs-modifiée.event';
import { NouveauDossierDeNominationEvent } from 'src/nominations-context/sessions/business-logic/models/events/nouveau-dossier-de-nomination.event';
import { Session } from 'src/nominations-context/sessions/business-logic/models/session';
import { ContenuPropositionDeNominationTransparenceV2 } from './proposition-de-nomination';
import { TransparenceXlsxImportéeEventPayload as GdsNewTransparenceImportedEventPayloadXlsx } from 'src/data-administration-context/transparence-xlsx/business-logic/models/events/transparence-xlsx-importée.event';

export type DossierAvecPayload<T extends boolean = boolean> = {
  dossier: DossierDeNomination;
  nouveauDossierEvent: NouveauDossierDeNominationEvent;
  rapporteurIds: T extends true ? string[] : string[] | null;
};

export class GdsTransparenceEventTransformer<T extends boolean = false> {
  constructor(
    private readonly _session: Session,
    private readonly _dossiers: DossierAvecPayload<T>[] = [],
  ) {}

  transformerXlsx(
    nominationFiles: GdsNewTransparenceImportedEventPayloadXlsx['nominationFiles'],
    dateEchéance: DateOnlyJson,
  ): GdsTransparenceEventTransformer {
    const dossiers = nominationFiles.map(({ nominationFileId, content }) => {
      const contenu: ContenuPropositionDeNominationTransparenceV2 = {
        version: 2,
        dateEchéance,
        historique: content.historique,
        dateDeNaissance: content.dateDeNaissance,
        posteActuel: content.posteActuel,
        posteCible: content.posteCible,
        numeroDeDossier: content.numeroDeDossier,
        grade: content.grade,
        nomMagistrat: content.magistrat,
        observants: content.observers,
        rang: content.rank,
        datePassageAuGrade: content.datePassageAuGrade,
        datePriseDeFonctionPosteActuel: content.datePriseDeFonctionPosteActuel,
        informationCarrière: content.informationCarriere,
      };

      const [dossier, nouveauDossierEvent] = this._session.nouveauDossier(
        nominationFileId,
        contenu,
      );

      const dossierAvecPayload = {
        dossier,
        nouveauDossierEvent,
        rapporteurIds: content.reporterIds,
      };
      return dossierAvecPayload;
    });

    return new GdsTransparenceEventTransformer(this._session, dossiers);
  }

  transformerTsv(
    nominationFiles:
      | GdsNewTransparenceImportedEventPayloadTsv['nominationFiles']
      | GdsTransparenceNominationFilesAddedEventPayload['nominationFiles'],
  ): GdsTransparenceEventTransformer {
    const dossiers = nominationFiles.map(({ nominationFileId, content }) => {
      const contenu: ContenuPropositionDeNominationTransparenceV2 = {
        version: 2,
        historique: content.biography,
        dateDeNaissance: content.birthDate,
        posteActuel: content.currentPosition,
        posteCible: content.targettedPosition,
        dateEchéance: content.dueDate!,
        numeroDeDossier: content.folderNumber,
        grade: content.grade,
        nomMagistrat: content.name,
        observants: content.observers,
        rang: content.rank,
        datePassageAuGrade: content.datePassageAuGrade,
        datePriseDeFonctionPosteActuel: content.datePriseDeFonctionPosteActuel,
        informationCarrière: content.informationCarrière,
      };

      const [dossier, nouveauDossierEvent] = this._session.nouveauDossier(
        nominationFileId,
        contenu,
      );

      const dossierAvecPayload = {
        dossier,
        nouveauDossierEvent,
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
    const dossiersFiltrés = this.filtrerAvecRapporteurs();

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
    const dossiersFiltrés = this.filtrerAvecRapporteurs();

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

  contientDossiers() {
    return this._dossiers.length > 0;
  }

  get dossiers() {
    return this._dossiers;
  }
}
