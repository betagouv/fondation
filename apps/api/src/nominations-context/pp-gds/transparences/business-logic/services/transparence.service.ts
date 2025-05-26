import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-imported.event';
import { GdsTransparenceNominationFilesAddedEventPayload } from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-nomination-files-added.event';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import { GdsTransparenceEventTransformer } from '../models/gds-transparence-event-transformer';
import { TypeDeSaisine } from 'shared-models';
import { ImportNouvelleTransparenceCommand } from '../use-cases/import-nouvelle-transparence/Import-nouvelle-transparence.command';
import { Session } from 'src/nominations-context/sessions/business-logic/models/session';
import { AffectationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/affectation.repository';
import { DossierDeNominationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/dossier-de-nomination.repository';
import { PréAnalyseRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/pré-analyse.repository';
import { SessionRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/session.repository';

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
        command.transparenceName,
        TypeDeSaisine.TRANSPARENCE_GDS,
        command.formation,
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
      const dossiersTransformer = new GdsTransparenceEventTransformer(
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
    dossiersTransformer: GdsTransparenceEventTransformer,
  ): TransactionableAsync {
    return async (trx) => {
      const affectationExistante = await this.affectationRepository.bySessionId(
        session.id,
      )(trx);

      if (affectationExistante) {
        const affectationModifiéeEvent =
          dossiersTransformer.mettreàJourAffectationRapporteurs(
            affectationExistante,
          );
        if (affectationModifiéeEvent) {
          await this.affectationRepository.save(affectationExistante)(trx);
          await this.domainEventRepository.save(affectationModifiéeEvent)(trx);
        }
      } else {
        const [affectation, affectationcréeEvent] =
          dossiersTransformer.créerAffectationRapporteurs(
            session.formation,
            TypeDeSaisine.TRANSPARENCE_GDS,
          );

        if (affectation && affectationcréeEvent) {
          await this.affectationRepository.save(affectation)(trx);
          await this.domainEventRepository.save(affectationcréeEvent)(trx);
        }
      }
    };
  }
}
