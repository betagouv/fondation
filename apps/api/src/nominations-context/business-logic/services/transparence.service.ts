import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';
import { DossierDeNomination } from 'src/nominations-context/business-logic/models/dossier-de-nomination';
import { PréAnalyse } from 'src/nominations-context/business-logic/models/pré-analyse';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { AffectationRepository } from '../gateways/repositories/affectation.repository';
import { DossierDeNominationRepository } from '../gateways/repositories/dossier-de-nomination.repository';
import { PréAnalyseRepository } from '../gateways/repositories/pré-analyse.repository';
import { TransparenceRepository } from '../gateways/repositories/transparence.repository';
import { Session } from '../models/session';
import { ImportNouvelleTransparenceCommand } from '../use-cases/import-nouvelle-transparence/Import-nouvelle-transparence.command';

type DossierAvecPayload = {
  dossier: DossierDeNomination;
  rules: GdsNewTransparenceImportedEventPayload['nominationFiles'][number]['rules'];
  rapporteurIds: string[];
};

export class TransparenceService {
  constructor(
    private readonly dossierDeNominationRepository: DossierDeNominationRepository,
    private readonly préAnalyseRepository: PréAnalyseRepository,
    private readonly transparenceRepository: TransparenceRepository,
    private readonly affectationRepository: AffectationRepository,
  ) {}

  nouvelleSession(
    command: ImportNouvelleTransparenceCommand,
  ): TransactionableAsync<Session> {
    return async (trx) => {
      const transparence = Session.nouvelle(
        command.transparenceId,
        command.typeDeSaisine,
        command.formations,
      );
      await this.transparenceRepository.save(transparence)(trx);
      return transparence;
    };
  }

  créerDossiersImportés(
    session: Session,
    nominationFiles: GdsNewTransparenceImportedEventPayload['nominationFiles'],
  ): TransactionableAsync {
    return async (trx) => {
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

        const dossierAvecPayload = {
          dossier: session.nouveauDossier(content),
          rules: nominationFile.rules,
          rapporteurIds: nominationFile.reporterIds,
        };
        return dossierAvecPayload;
      });

      for (const { dossier, rules } of dossiers) {
        await this.dossierDeNominationRepository.save(dossier)(trx);
        await this.createFromRulesV1(dossier.id, rules)(trx);
      }

      await this.affecterRapporteurs(
        session,
        dossiers.filter(
          (dossier) =>
            dossier.rapporteurIds && dossier.rapporteurIds.length > 0,
        ) as DossierAvecPayload[],
      )(trx);
    };
  }

  private createFromRulesV1(
    dossierId: string,
    rules: GdsNewTransparenceImportedEventPayload['nominationFiles'][number]['rules'],
  ): TransactionableAsync {
    return async (trx) => {
      const préAnalyse = PréAnalyse.fromTransparenceRulesV1(dossierId, rules);
      await this.préAnalyseRepository.save(préAnalyse)(trx);
    };
  }

  private affecterRapporteurs(
    session: Session,
    dossiers: Pick<DossierAvecPayload, 'dossier' | 'rapporteurIds'>[],
  ): TransactionableAsync {
    return async (trx) => {
      const affectations = session.affecterRapporteurs(dossiers);

      for (const affectation of affectations) {
        await this.affectationRepository.save(affectation)(trx);
      }
    };
  }
}
