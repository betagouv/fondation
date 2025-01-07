import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ValidateSessionUseCase } from 'src/identity-and-access-context/business-logic/use-cases/session-validation/validate-session.use-case';
import { LoginUserUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-login/login-user.use-case';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly loginUser: LoginUserUseCase,
    private readonly validateSessionUseCase: ValidateSessionUseCase,
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
    const isValid = await this.validateSessionUseCase.execute(sessionId);
    if (isValid) {
      return res.status(HttpStatus.OK).send();
    } else {
      return res.status(HttpStatus.UNAUTHORIZED).send();
    }
  }
}
