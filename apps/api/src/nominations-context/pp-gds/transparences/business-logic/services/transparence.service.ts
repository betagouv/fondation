import { DateOnlyJson, Magistrat, TypeDeSaisine } from 'shared-models';
import { GdsNewTransparenceImportedEventPayload as GdsNewTransparenceImportedEventPayloadTsv } from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-imported.event';
import { GdsTransparenceNominationFilesAddedEventPayload } from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-nomination-files-added.event';
import { GdsNewTransparenceImportedEventPayload as GdsNewTransparenceImportedEventPayloadXlsx } from 'src/data-administration-context/transparence-xlsx/business-logic/models/events/gds-transparence-imported.event';
import { AffectationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/affectation.repository';
import { DossierDeNominationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/dossier-de-nomination.repository';
import { SessionRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/session.repository';
import { Session } from 'src/nominations-context/sessions/business-logic/models/session';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import { GdsTransparenceEventTransformer } from '../models/gds-transparence-event-transformer';

export class TransparenceService {
  constructor(
    private readonly dossierDeNominationRepository: DossierDeNominationRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly affectationRepository: AffectationRepository,
    private readonly domainEventRepository: DomainEventRepository,
  ) {}

  nouvelleTransparence(
    transparenceImportéeId: string,
    transparenceName: string,
    formation: Magistrat.Formation,
  ): TransactionableAsync<Session> {
    return async (trx) => {
      const session = Session.nouvelle(
        transparenceImportéeId,
        transparenceName,
        TypeDeSaisine.TRANSPARENCE_GDS,
        formation,
      );
      await this.sessionRepository.save(session)(trx);
      return session;
    };
  }

  créerDossiersXlsxImportés(
    session: Session,
    nominationFiles: GdsNewTransparenceImportedEventPayloadXlsx['nominationFiles'],
    dateEchéance: DateOnlyJson,
  ): TransactionableAsync {
    return async (trx) => {
      const dossiersTransformer = new GdsTransparenceEventTransformer(
        session,
      ).transformerXlsx(nominationFiles, dateEchéance);

      for (const {
        dossier,
        nouveauDossierEvent,
      } of dossiersTransformer.dossiers) {
        await this.dossierDeNominationRepository.save(dossier)(trx);
        await this.domainEventRepository.save(nouveauDossierEvent)(trx);
      }

      await this.affecterRapporteurs(session, dossiersTransformer)(trx);
    };
  }

  créerDossiersImportés(
    session: Session,
    nominationFiles:
      | GdsNewTransparenceImportedEventPayloadTsv['nominationFiles']
      | GdsTransparenceNominationFilesAddedEventPayload['nominationFiles'],
  ): TransactionableAsync {
    return async (trx) => {
      const dossiersTransformer = new GdsTransparenceEventTransformer(
        session,
      ).transformerTsv(nominationFiles);

      for (const {
        dossier,
        nouveauDossierEvent,
      } of dossiersTransformer.dossiers) {
        await this.dossierDeNominationRepository.save(dossier)(trx);
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
