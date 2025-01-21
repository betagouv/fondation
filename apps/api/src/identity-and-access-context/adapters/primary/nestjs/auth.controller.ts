import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  AuthenticatedUser,
  IdentityAndAccessRestContract,
} from 'shared-models';
import { ValidateSessionUseCase } from 'src/identity-and-access-context/business-logic/use-cases/session-validation/validate-session.use-case';
import { LoginUserUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-login/login-user.use-case';
import { LogoutUserUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-logout/logout-user.use-case';
import { UserWithFullNameUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-with-full-name/user-with-full-name.use-case';
import { UserWithIdUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-with-id/user-with-id.use-case';
import {
  IController,
  IControllerPaths,
} from 'src/shared-kernel/adapters/primary/nestjs/controller';
import { CookieSignatureProvider } from '../../secondary/gateways/providers/hmac-signature.provider';
import { LoginNestDto } from './dto/login.dto';
import { UserWithFullNameParamsNestDto } from './dto/user-with-full-name-params.dto';
import { UserWithIdParamsNestDto } from './dto/user-with-id-params.dto';
import { ValidateSessionNestDto } from './dto/validate-session.dto';
import { UserDescriptor } from 'src/identity-and-access-context/business-logic/models/user-descriptor';

type IAuthController = IController<IdentityAndAccessRestContract>;

export const baseRoute: IdentityAndAccessRestContract['basePath'] = 'api/auth';
export const endpointsPaths: IControllerPaths<IdentityAndAccessRestContract> = {
  login: 'login',
  validateSession: 'validate-session',
  logout: 'logout',
  userWithFullName: 'user-with-full-name/:fullName',
  userWithId: 'user-with-id/:userId',
};

@Controller(baseRoute)
export class AuthController implements IAuthController {
  constructor(
    private readonly loginUser: LoginUserUseCase,
    private readonly validateSessionUseCase: ValidateSessionUseCase,
    private readonly logoutUser: LogoutUserUseCase,
    private readonly signatureProvider: CookieSignatureProvider,
    private readonly userWithFullNameUseCase: UserWithFullNameUseCase,
    private readonly userWithIdUseCase: UserWithIdUseCase,
  ) {}

  @Post(endpointsPaths.login)
  async login(_: any, @Body() loginDto: LoginNestDto, @Res() res: Response) {
    try {
      const { sessionId, userDescriptor } = await this.loginUser.execute(
        loginDto.email,
        loginDto.password,
      );
      this.createSessionCookie(sessionId, res);
      const authenticatedUser: AuthenticatedUser = userDescriptor.serialize();
      return res.status(HttpStatus.OK).send(authenticatedUser);
    } catch {
      return res.status(HttpStatus.UNAUTHORIZED).send('Invalid credentials');
    }
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

  @Get(endpointsPaths.userWithId)
  async userWithId(@Param() params: UserWithIdParamsNestDto) {
    const userDescriptor = await this.userWithIdUseCase.execute(params.userId);
    return this.responseWithUserDescriptor(userDescriptor);
  }

  @Get(endpointsPaths.userWithFullName)
  async userWithFullName(@Param() params: UserWithFullNameParamsNestDto) {
    const userDescriptor = await this.userWithFullNameUseCase.execute(
      params.fullName,
    );
    return this.responseWithUserDescriptor(userDescriptor);
  }

  private responseWithUserDescriptor(
    userDescriptor: UserDescriptor | null,
  ): AuthenticatedUser {
    if (!userDescriptor) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return userDescriptor.serialize();
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
    return this.signatureProvider.sign(sessionId);
  }

  private unsignedSessionIdFromCookies(cookies: Request['cookies']) {
    const signedSessionId = cookies['sessionId'];
    if (!signedSessionId) throw new Error('Session ID not found in cookies');
    return this.unsignedSessionId(signedSessionId);
  }

  private unsignedSessionId(signedSessionId: string) {
    const sessionId = this.signatureProvider.unsign(signedSessionId);
    return sessionId;
  }
}
