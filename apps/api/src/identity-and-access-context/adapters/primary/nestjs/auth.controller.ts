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
import { ValidateSessionUseCase } from 'src/identity-and-access-context/business-logic/use-cases/session-validation/validate-session.use-case';
import { LoginUserUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-login/login-user.use-case';
import { LogoutUserUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-logout/logout-user.use-case';
import { LoginDto } from './dto/login.dto';
import { SignatureProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/signature.provider';
import { SIGNATURE_PROVIDER } from './tokens';
import { API_CONFIG } from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly loginUser: LoginUserUseCase,
    private readonly validateSessionUseCase: ValidateSessionUseCase,
    private readonly logoutUser: LogoutUserUseCase,
    @Inject(SIGNATURE_PROVIDER)
    private readonly signatureProvider: SignatureProvider,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const sessionId = await this.loginUser.execute(
      loginDto.email,
      loginDto.password,
    );

    if (!sessionId) {
      return res.status(HttpStatus.UNAUTHORIZED).send();
    }

    const secret = this.apiConfig.cookieSecret;
    const signedSessionId = this.signatureProvider.sign(sessionId, secret);
    this.createSessionCookie(res, signedSessionId);
    return res.status(HttpStatus.OK).send();
  }

  @Post('validate-session')
  async validateSession(
    @Body('sessionId') signedSessionId: string,
    @Res() res: Response,
  ) {
    const sessionId = this.unsignedSessionId(signedSessionId);
    if (sessionId === false) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .send('Cannot logout with this session ID');
    }

    const userId = await this.validateSessionUseCase.execute(sessionId);

    return res.status(HttpStatus.OK).send(userId);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
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

  private createSessionCookie(res: Response, signedSessionId: string) {
    res.cookie('sessionId', signedSessionId, {
      httpOnly: true,
      secure: true,
    });
  }

  private clearSessionCookie(res: Response) {
    res.clearCookie('sessionId', {
      httpOnly: true,
      secure: true,
    });
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
