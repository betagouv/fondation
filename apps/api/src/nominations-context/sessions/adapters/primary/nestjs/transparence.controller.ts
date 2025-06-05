import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { NominationsContextTransparenceRestContract } from 'shared-models';
import {
  IController,
  IControllerPaths,
} from 'src/shared-kernel/adapters/primary/nestjs/controller';
import { GetTransparenceSnapshotUseCase } from '../../../business-logic/use-cases/get-transparence-snapshot/get-transparence-snapshot.use-case';
import { TransparenceSnapshotQueryParamsNestDto } from './dto/transparence-snapshot-query-params.nest-dto';

type ITransparenceController =
  IController<NominationsContextTransparenceRestContract>;

export const baseRoute: NominationsContextTransparenceRestContract['basePath'] =
  'api/nominations/transparence';
export const endpointsPaths: IControllerPaths<NominationsContextTransparenceRestContract> =
  {
    transparenceSnapshot: 'snapshot',
  };

@Controller(baseRoute)
export class TransparenceController implements ITransparenceController {
  constructor(
    private readonly getTransparenceSnapshotUseCase: GetTransparenceSnapshotUseCase,
  ) {}

  @Get(endpointsPaths.transparenceSnapshot)
  async transparenceSnapshot(
    @Query() params: TransparenceSnapshotQueryParamsNestDto,
  ) {
    const session = await this.getTransparenceSnapshotUseCase.execute(
      params.nom,
      params.formation,
      params.dateTransparence,
    );
    if (!session) {
      throw new NotFoundException(
        `Transparence with name ${params.nom}, formation ${params.formation}, and date ${JSON.stringify(params.dateTransparence)} not found`,
      );
    }

    return session;
  }
}
