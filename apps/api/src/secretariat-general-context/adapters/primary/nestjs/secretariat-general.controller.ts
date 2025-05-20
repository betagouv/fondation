import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  NouvelleTransparenceDto,
  SecretariatGeneralContextRestContract,
} from 'shared-models';

import { NouvelleTransparenceUseCase } from 'src/secretariat-general-context/business-logic/use-cases/nouvelle-transparence/nouvelle-transparence.use-case';
import {
  IController,
  IControllerPaths,
} from 'src/shared-kernel/adapters/primary/nestjs/controller';

type ISecretariatGeneralController =
  IController<SecretariatGeneralContextRestContract>;

const baseRoute: SecretariatGeneralContextRestContract['basePath'] =
  'api/secretariat-general';

const endpointsPaths: IControllerPaths<SecretariatGeneralContextRestContract> =
  {
    nouvelleTransparence: 'nouvelle-transparence',
  };

@Controller(baseRoute)
export class SecretariatGeneralController
  implements ISecretariatGeneralController
{
  constructor(
    private readonly nouvelleTransparenceUseCase: NouvelleTransparenceUseCase,
  ) {}

  @Post(endpointsPaths.nouvelleTransparence)
  @UseInterceptors(FileInterceptor('fichier'))
  async nouvelleTransparence(
    @UploadedFile() fichier: Express.Multer.File,
    @Body() body: NouvelleTransparenceDto,
  ): Promise<void> {
    console.log(
      'voici un formulaire avec mon body',
      body,
      'et mon fichier',
      fichier,
    );
    return;
    // return this.nouvelleTransparenceUseCase.execute(nouvelleTransparenceDto);
  }
}
