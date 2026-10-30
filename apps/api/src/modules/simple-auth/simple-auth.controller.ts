import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseFilters,
  UsePipes,
} from '@nestjs/common';
import { ApiBasicAuth, ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  type CookieOptions,
  type Request as ExpressRequest,
  type Response as ExpressResponse,
} from 'express';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { AuthImpersonation } from './domain/auth-impersonation';
import { AuthSession } from './domain/auth-session';
import { AuthExceptionFilter } from './infrastructure/auth.filter';
import { ChangePasswordDto, LoginDto } from './infrastructure/dto/auth.dto';
import { DetailedUserResponseDto } from './infrastructure/queries/details-user.query';
import { AuthedUser, HasRole } from './simple-auth.decorator';
import { SimpleAuthService } from './simple-auth.service';

@ApiTags('Auth')
@UseFilters(AuthExceptionFilter)
@Controller('/api/auth/v2')
export class SimpleAuthController {
  private static readonly COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    signed: true,
  };

  constructor(private readonly auth: SimpleAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @ApiBody({ required: false, type: LoginDto })
  @ApiBasicAuth()
  @ApiResponse({
    headers: {
      'Set-Cookie': {
        example: 'sessionId=f256088e-e97a-4b56-919a-20af8329421a',
      },
    },
    status: HttpStatus.NO_CONTENT,
  })
  async login(
    @Body() body: LoginDto | undefined,
    @Req() req: ExpressRequest,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const authorization = req.get('authorization');
    if (/^basic/i.test(authorization || '')) {
      // Only the user-id cannot contain a colon (RFC 7617): the password keeps everything after the first one
      const [, email, password] =
        /^([^:]*):(.*)$/s.exec(
          Buffer.from((authorization ?? '').split(' ').slice(1).join(' ').trim(), 'base64').toString(),
        ) ?? [];
      const credentials = LoginDto.schema.safeParse({ email, password });
      if (!credentials.success) throw new BadRequestException();
      body = credentials.data;
    } else if (!body) {
      throw new BadRequestException();
    }

    const session = await this.auth.login(body);
    // an impersonation left over, ended or of an account deactivated since, would refuse every request of the new session
    this.unDecorateResponse(this.decorateResponse(res, session), 'impersonationId').end();
  }

  @Get('introspect')
  @HasRole()
  @ZodResponse({ status: HttpStatus.OK, type: DetailedUserResponseDto })
  introspectSession(
    @AuthedUser() user: { id: string; impersonation?: { id: string } },
  ): Promise<DetailedUserResponseDto> {
    return this.auth.detailsUser({
      impersonationId: user.impersonation?.id,
      userId: user.id,
    });
  }

  @Put('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @HasRole()
  @UsePipes(ZodValidationPipe)
  changePassword(
    @AuthedUser() user: { id: string; impersonation?: { id: string }; sessionId: string },
    @Body() body: ChangePasswordDto,
  ): Promise<void> {
    return this.auth.changePassword({
      ...body,
      isImpersonated: !!user.impersonation,
      sessionId: user.sessionId,
      userId: user.id,
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @HasRole()
  async logout(
    @AuthedUser()
    user: {
      id: string;
      impersonation?: { id: string; impersonatorId: string };
      sessionId: string;
    },
    @Res() response: ExpressResponse,
  ): Promise<void> {
    if (!user.sessionId && !user.impersonation) {
      throw new NotFoundException();
    }

    const { id: userId, impersonation, sessionId } = user;

    if (impersonation) {
      const { id: impersonationId, impersonatorId: userId } = impersonation;
      await this.auth.unImpersonate({
        impersonationId,
        userId,
      });
      this.unDecorateResponse(response, 'impersonationId').end();
      return;
    }

    await this.auth.unAuthenticate({ sessionId, userId });
    this.unDecorateResponse(response, 'sessionId').end();
  }

  @Post('users/:userId/impersonations')
  @HttpCode(HttpStatus.NO_CONTENT)
  @HasRole('ADMIN')
  async impersonate(
    @Param('userId') targetUserId: string,
    @Res() res: ExpressResponse,
    @AuthedUser() user: { id: string; sessionId: string },
  ): Promise<void> {
    const impersonation = await this.auth.impersonate({
      authSessionId: user.sessionId,
      targetUserId,
      userId: user.id,
    });

    this.decorateResponse(res, impersonation).end();
  }

  private decorateResponse(res: ExpressResponse, data: AuthSession | AuthImpersonation): ExpressResponse {
    const key = data instanceof AuthImpersonation ? 'impersonationId' : 'sessionId';

    return res.cookie(key, data.id, {
      ...SimpleAuthController.COOKIE_OPTIONS,
      expires: data.expiresAt,
    });
  }

  private unDecorateResponse(res: ExpressResponse, key: 'sessionId' | 'impersonationId'): ExpressResponse {
    return res.clearCookie(key, SimpleAuthController.COOKIE_OPTIONS);
  }
}
