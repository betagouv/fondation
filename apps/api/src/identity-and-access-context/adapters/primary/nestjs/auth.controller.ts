import {
  Body,
  Controller,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { IdentityAndAccessRestContract } from 'shared-models';
import { SignatureProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/signature.provider';
import { ValidateSessionUseCase } from 'src/identity-and-access-context/business-logic/use-cases/session-validation/validate-session.use-case';
import { LoginUserUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-login/login-user.use-case';
import { LogoutUserUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-logout/logout-user.use-case';
import {
  IController,
  IControllerPaths,
} from 'src/shared-kernel/adapters/primary/nestjs/controller';
import { API_CONFIG } from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';
import { LoginNestDto } from './dto/login.dto';
import { ValidateSessionNestDto } from './dto/validate-session.dto';
import { SIGNATURE_PROVIDER } from './tokens';

type IAuthController = IController<IdentityAndAccessRestContract>;

const baseRoute: IdentityAndAccessRestContract['basePath'] = 'api/auth';
const endpointsPaths: IControllerPaths<IdentityAndAccessRestContract> = {
  login: 'login',
  validateSession: 'validate-session',
  logout: 'logout',
};

@Controller(baseRoute)
export class AuthController implements IAuthController {
  constructor(
    private readonly loginUser: LoginUserUseCase,
    private readonly validateSessionUseCase: ValidateSessionUseCase,
    private readonly logoutUser: LogoutUserUseCase,
    @Inject(SIGNATURE_PROVIDER)
    private readonly signatureProvider: SignatureProvider,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  @Post(endpointsPaths.login)
  async login(_: any, @Body() loginDto: LoginNestDto, @Res() res: Response) {
    const { sessionId, userDescriptor } = await this.loginUser.execute(
      loginDto.email,
      loginDto.password,
    );
    this.createSessionCookie(sessionId, res);
    return res.status(HttpStatus.OK).send(userDescriptor);
  }

  @Post(endpointsPaths.validateSession)
  async validateSession(
    _: any,
    @Body() body: ValidateSessionNestDto,
    @Res() res: Response,
  ) {
    const signedSessionId = body.sessionId;
    const sessionId = this.unsignedSessionId(signedSessionId);

    if (sessionId === false) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .send('Cannot logout with this session ID');
    }

    const userId = await this.validateSessionUseCase.execute(sessionId);
    return res.status(HttpStatus.OK).send(userId);
  }

  @Post(endpointsPaths.logout)
  async logout(_: any, __: any, @Req() req: Request, @Res() res: Response) {
    const sessionId = this.unsignedSessionIdFromCookies(req.cookies);

    if (sessionId === false) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .send('Cannot logout with this session ID');
    }

    await this.logoutUser.execute(sessionId);
    this.clearSessionCookie(res);
    return res.status(HttpStatus.OK).send();
  }

  private createSessionCookie(sessionId: string, res: Response) {
    const signedSessionId = this.signedSessionId(sessionId);
    res.cookie('sessionId', signedSessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
  }

  private clearSessionCookie(res: Response) {
    res.clearCookie('sessionId', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
  }

  private signedSessionId(sessionId: string) {
    const secret = this.apiConfig.cookieSecret;
    return this.signatureProvider.sign(sessionId, secret);
  }

  private unsignedSessionIdFromCookies(cookies: Request['cookies']) {
    const signedSessionId = cookies['sessionId'];
    if (!signedSessionId) throw new Error('Session ID not found in cookies');
    return this.unsignedSessionId(signedSessionId);
  }

  private unsignedSessionId(signedSessionId: string) {
    const secret = this.apiConfig.cookieSecret;
    const sessionId = this.signatureProvider.unsign(signedSessionId, secret);
    return sessionId;
  }
}
