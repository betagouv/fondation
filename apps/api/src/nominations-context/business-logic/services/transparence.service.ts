import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';
import { GdsTransparenceNominationFilesAddedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-nomination-files-added.event';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import { AffectationRepository } from '../gateways/repositories/affectation.repository';
import { DossierDeNominationRepository } from '../gateways/repositories/dossier-de-nomination.repository';
import { PréAnalyseRepository } from '../gateways/repositories/pré-analyse.repository';
import { SessionRepository } from '../gateways/repositories/session.repository';
import { GdsNewTransparenceEventTransformer } from '../models/gds-new-transparence-event-transformer';
import { Session } from '../models/session';
import { ImportNouvelleTransparenceCommand } from '../use-cases/import-nouvelle-transparence/Import-nouvelle-transparence.command';

export class TransparenceService {
  constructor(
    private readonly dossierDeNominationRepository: DossierDeNominationRepository,
    private readonly préAnalyseRepository: PréAnalyseRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly affectationRepository: AffectationRepository,
    private readonly domainEventRepository: DomainEventRepository,
  ) {}

  nouvelleSession(
    command: ImportNouvelleTransparenceCommand,
  ): TransactionableAsync<Session> {
    return async (trx) => {
      const session = Session.nouvelle(
        command.transparenceId,
        command.typeDeSaisine,
        command.formations,
      );
      await this.sessionRepository.save(session)(trx);
      return session;
    };
  }

  créerDossiersImportés(
    session: Session,
    nominationFiles:
      | GdsNewTransparenceImportedEventPayload['nominationFiles']
      | GdsTransparenceNominationFilesAddedEventPayload['nominationFiles'],
  ): TransactionableAsync {
    return async (trx) => {
      const dossiersTransformer = new GdsNewTransparenceEventTransformer(
        session,
      ).transformer(nominationFiles);

      for (const {
        dossier,
        nouveauDossierEvent,
        préAnalyse,
      } of dossiersTransformer.dossiers) {
        await this.dossierDeNominationRepository.save(dossier)(trx);
        await this.préAnalyseRepository.save(préAnalyse)(trx);
        await this.domainEventRepository.save(nouveauDossierEvent)(trx);
      }

      await this.affecterRapporteurs(session, dossiersTransformer)(trx);
    };
  }

  private affecterRapporteurs(
    session: Session,
    dossiersTransformer: GdsNewTransparenceEventTransformer,
  ): TransactionableAsync {
    return async (trx) => {
      const affectations = session.affecterRapporteurs(
        dossiersTransformer.filtrerAvecRapporteurs().dossiers,
      );

      for (const affectation of affectations) {
        await this.affectationRepository.save(affectation)(trx);
      }
    };
  }
}
