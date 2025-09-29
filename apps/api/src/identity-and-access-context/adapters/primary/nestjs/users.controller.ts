import { Controller, Get, Param } from '@nestjs/common';
import { UserRestContract } from 'shared-models/models/endpoints/identity-and-access/users.endpoints';
import { FormationQueryParamsDto } from 'src/identity-and-access-context/adapters/primary/nestjs/dto/formation-query-params.dto';
import { UsersByFormationUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-by-formation/user-by-formation.use-case';

import {
  IController,
  IControllerPaths,
} from 'src/shared-kernel/adapters/primary/nestjs/controller';

type IUserController = IController<UserRestContract>;

export const baseUserRoute: UserRestContract['basePath'] = 'api/users';
export const endpointsUserPaths: IControllerPaths<UserRestContract> = {
  usersByFormation: 'by-formation/:formation',
};

@Controller(baseUserRoute)
export class UserController implements IUserController {
  constructor(
    private readonly usersByFormationUseCase: UsersByFormationUseCase,
  ) {}

  @Get(endpointsUserPaths.usersByFormation)
  async usersByFormation(@Param() { formation }: FormationQueryParamsDto) {
    return this.usersByFormationUseCase.execute(formation);
  }
}
