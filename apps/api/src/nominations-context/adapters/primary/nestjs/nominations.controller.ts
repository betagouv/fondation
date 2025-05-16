import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { NominationsContextRestContract } from 'shared-models';
import {
  IController,
  IControllerPaths,
} from 'src/shared-kernel/adapters/primary/nestjs/controller';
import { GetDossierDeNominationSnapshotUseCase } from '../../../business-logic/use-cases/get-dossier-de-nomination-snapshot/get-dossier-de-nomination-snapshot.use-case';
import { GetSessionSnapshotUseCase } from '../../../business-logic/use-cases/get-session-snapshot/get-session-snapshot.use-case';
import { DossierDeNominationSnapshotParamsNestDto } from './dto/dossier-de-nomination-snapshot-params.nest-dto';
import { SessionSnapshotParamsNestDto } from './dto/session-snapshot-params.nest-dto';

type INominationsController = IController<NominationsContextRestContract>;

export const baseRoute: NominationsContextRestContract['basePath'] =
  'api/nominations';
export const endpointsPaths: IControllerPaths<NominationsContextRestContract> =
  {
    sessionSnapshot: 'session/snapshot/by-id/:sessionId',
    dossierDeNominationSnapshot:
      'dossier-de-nomination/snapshot/by-id/:dossierId',
  };

@Controller(baseRoute)
export class NominationsController implements INominationsController {
  constructor(
    private readonly getDossierDeNominationSnapshotUseCase: GetDossierDeNominationSnapshotUseCase,
    private readonly getSessionSnapshotUseCase: GetSessionSnapshotUseCase,
  ) {}

  @Get(endpointsPaths.sessionSnapshot)
  async sessionSnapshot(@Param() params: SessionSnapshotParamsNestDto) {
    const session = await this.getSessionSnapshotUseCase.execute(
      params.sessionId,
    );
    if (!session) {
      throw new NotFoundException(
        `Session with ID ${params.sessionId} not found`,
      );
    }

    return session;
  }

  @Get(endpointsPaths.dossierDeNominationSnapshot)
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
