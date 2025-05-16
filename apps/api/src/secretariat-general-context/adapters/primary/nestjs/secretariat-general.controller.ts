import { Body, Controller, Post } from '@nestjs/common';
import { SecretariatGeneralContextRestContract } from 'shared-models';
import { NouvelleTransparenceDto } from 'src/secretariat-general-context/adapters/primary/nestjs/dto/nouvelle-trasparence.dto';
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
  async nouvelleTransparence(
    @Body() nouvelleTransparenceDto: NouvelleTransparenceDto,
  ) {
    console.log(
      'Un coucou de mon controller, je reçois ton formulaire mon champion',
      nouvelleTransparenceDto,
    );
    return this.nouvelleTransparenceUseCase.execute(nouvelleTransparenceDto);
  }
}
