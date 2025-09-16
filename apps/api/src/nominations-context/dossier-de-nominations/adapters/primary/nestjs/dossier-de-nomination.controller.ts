import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { DossierDeNominationRestContrat } from 'shared-models/models/endpoints/nominations/dossier-de-nominations.endpoints';
import { DossierDeNominationSnapshotParamsNestDto } from 'src/nominations-context/dossier-de-nominations/adapters/primary/nestjs/dto/dossier-de-nomination-snapshot-params.nest-dto';
import { SessionIdParamsNestDto } from 'src/nominations-context/dossier-de-nominations/adapters/primary/nestjs/dto/session-id-params.nest-dto';
import { GetBySessionIdUseCase } from 'src/nominations-context/dossier-de-nominations/business-logic/use-cases/get-by-session-id/get-dossier-de-nomination-snapshot.use-case';
import { GetDossierDeNominationSnapshotUseCase } from 'src/nominations-context/dossier-de-nominations/business-logic/use-cases/get-dossier-de-nomination-snapshot/get-dossier-de-nomination-snapshot.use-case';
import {
  IController,
  IControllerPaths,
} from 'src/shared-kernel/adapters/primary/nestjs/controller';

type IDossierDeNominationController =
  IController<DossierDeNominationRestContrat>;

export const baseRoute: DossierDeNominationRestContrat['basePath'] =
  'api/nominations/dossier-de-nominations';
export const dossierDeNominationsEndpointsPath: IControllerPaths<DossierDeNominationRestContrat> =
  {
    dossierDeNominationSnapshot: 'snapshot/by-id/:dossierId',
    dossierDeNominationParSession: 'snapshot/by-session',
  };

@Controller(baseRoute)
export class DossierDeNominationController
  implements IDossierDeNominationController
{
  constructor(
    private readonly getDossierDeNominationSnapshotUseCase: GetDossierDeNominationSnapshotUseCase,
    private readonly getBySessionIdUseCase: GetBySessionIdUseCase,
  ) {}

  @Get(dossierDeNominationsEndpointsPath.dossierDeNominationParSession)
  async dossierDeNominationParSession(@Param() params: SessionIdParamsNestDto) {
    return this.getBySessionIdUseCase.execute(params.sessionId);
  }

  @Get(dossierDeNominationsEndpointsPath.dossierDeNominationSnapshot)
  async dossierDeNominationSnapshot(
    @Param() params: DossierDeNominationSnapshotParamsNestDto,
  ) {
    const dossier = await this.getDossierDeNominationSnapshotUseCase.execute(
      params.dossierId,
    );

    if (!dossier) {
      throw new NotFoundException(
        `Dossier de nomination with ID ${params.dossierId} not found`,
      );
    }

    return dossier;
  }
}
