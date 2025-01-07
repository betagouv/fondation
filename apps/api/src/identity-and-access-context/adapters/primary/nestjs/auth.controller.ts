import { Body, Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidateSessionUseCase } from 'src/identity-and-access-context/business-logic/use-cases/session-validation/validate-session.use-case';
import { LoginUserUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-login/login-user.use-case';
import { LogoutUserUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-logout/logout-user.use-case';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly loginUser: LoginUserUseCase,
    private readonly validateSessionUseCase: ValidateSessionUseCase,
    private readonly logoutUser: LogoutUserUseCase,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const sessionId = await this.loginUser.execute(
      loginDto.email,
      loginDto.password,
    );

    if (sessionId) {
      res.cookie('sessionId', sessionId, { httpOnly: true, secure: true });
      return res.status(HttpStatus.OK).send();
    } else {
      return res.status(HttpStatus.UNAUTHORIZED).send();
    }
  }

  @Post('validate-session')
  async validateSession(
    @Body('sessionId') sessionId: string,
    @Res() res: Response,
  ) {
    const userId = await this.validateSessionUseCase.execute(sessionId);
    return res.status(HttpStatus.OK).send(userId);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const sessionId = req.cookies['sessionId'];
    if (sessionId) {
      await this.logoutUser.execute(sessionId);
      res.clearCookie('sessionId', {
        httpOnly: true,
        secure: true,
      });
      return res.status(HttpStatus.OK).send();
    } else {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send('Cannot logout with this session ID');
    }
  }
}
