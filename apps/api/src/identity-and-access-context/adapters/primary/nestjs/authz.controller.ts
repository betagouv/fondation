import { Controller, Get, Param } from '@nestjs/common';
import { IdentityAndAccessAuthzRestContract } from 'shared-models';
import { HasReadFilePermissionUseCase } from 'src/identity-and-access-context/business-logic/use-cases/file-read-permission/has-read-file-permission.use-case';
import {
  IController,
  IControllerPaths,
} from 'src/shared-kernel/adapters/primary/nestjs/controller';
import { UserCanReadFileParamsNestDto } from './dto/user-can-read-file-params.dto';

type IAuthzController = IController<IdentityAndAccessAuthzRestContract>;

export const baseRoute: IdentityAndAccessAuthzRestContract['basePath'] =
  'api/authz';
export const endpointsPaths: IControllerPaths<IdentityAndAccessAuthzRestContract> =
  {
    userCanReadFile: 'user/:userId/can-read-file/:fileId',
  };

@Controller(baseRoute)
export class AuthzController implements IAuthzController {
  constructor(
    private readonly hasReadFilePermissionUseCase: HasReadFilePermissionUseCase,
  ) {}

  @Get(endpointsPaths.userCanReadFile)
  async userCanReadFile(@Param() params: UserCanReadFileParamsNestDto) {
    return this.hasReadFilePermissionUseCase.execute({
      userId: params.userId,
      fileId: params.fileId,
    });
  }
}
