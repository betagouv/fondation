import { Magistrat } from 'shared-models';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import { ReportRepository } from '../../gateways/repositories/report.repository';
import { NominationFileReport } from '../../models/nomination-file-report';

export class CreateReportCommand {
  private constructor(
    private readonly _dossierDeNominationId: string,
    private readonly _sessionId: string,
    private readonly _formation: Magistrat.Formation,
    private readonly _rapporteurId: string,
  ) {}

  get rapporteurId(): string {
    return this._rapporteurId;
  }
  get formation(): Magistrat.Formation {
    return this._formation;
  }
  get sessionId(): string {
    return this._sessionId;
  }
  get dossierDeNominationId(): string {
    return this._dossierDeNominationId;
  }

  static create({
    dossierDeNominationId,
    sessionId,
    formation,
    rapporteurId,
  }: {
    dossierDeNominationId: string;
    sessionId: string;
    formation: Magistrat.Formation;
    rapporteurId: string;
  }) {
    return new CreateReportCommand(
      dossierDeNominationId,
      sessionId,
      formation,
      rapporteurId,
    );
  }
}

export class CreateReportUseCase {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly domainEventRepository: DomainEventRepository,
  ) {}

  execute(command: CreateReportCommand): TransactionableAsync {
    return async (trx) => {
      const [rapport, rapportCrééEvent] = NominationFileReport.createFromImport(
        command.sessionId,
        command.dossierDeNominationId,
        command.formation,
        command.rapporteurId,
      );

      await this.reportRepository.save(rapport)(trx);
      await this.domainEventRepository.save(rapportCrééEvent)(trx);
    };
  }
}
