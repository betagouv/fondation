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
  Req,
  Res,
  UseFilters,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBasicAuth,
  ApiBody,
  ApiConsumes,
  ApiExcludeEndpoint,
  ApiExtraModels,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  type CookieOptions,
  type Request as ExpressRequest,
  type Response as ExpressResponse,
} from 'express';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { Role } from 'shared-models';

import { AuthImpersonation } from './domain/auth-impersonation';
import { AuthSession } from './domain/auth-session';
import { AuthExceptionFilter } from './infrastructure/auth.filter';
import { LoginDto, RegisteredUserDto, RegisterUserDto } from './infrastructure/dto/auth.dto';
import { DevelopmentEnvironmentGuard } from './infrastructure/guards/development-environment.guard';
import { DetailedUserResponseDto } from './infrastructure/queries/details-user.query';
import { AuthedUser, HasRole } from './simple-auth.decorator';
import { SimpleAuthService } from './simple-auth.service';

@ApiTags('Auth')
@ApiExtraModels(RegisterUserDto, RegisteredUserDto)
@UseFilters(AuthExceptionFilter)
@Controller('/api/auth/v2')
export class SimpleAuthController {
  private static readonly COOKIE_OPTIONS: CookieOptions = {
    signed: true,
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  };

  constructor(private readonly auth: SimpleAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(ZodValidationPipe)
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @ApiBody({ type: LoginDto, required: false })
  @ApiBasicAuth()
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    headers: {
      'Set-Cookie': {
        example: 'sessionId=f256088e-e97a-4b56-919a-20af8329421a',
      },
    },
  })
  async login(
    @Body() body: LoginDto | undefined,
    @Req() req: ExpressRequest,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const authorization = req.get('authorization');
    if (/^basic/i.test(authorization || '')) {
      const [email, password] = Buffer.from(
        (authorization ?? '').split(' ').slice(1).join(' ').trim(),
        'base64',
      )
        .toString()
        .split(':');
      body = LoginDto.schema.parse({ email, password });
    } else if (!body) {
      throw new BadRequestException();
    }

    const session = await this.auth.login(body);
    this.decorateResponse(res, session).end();
  }

  @Get('introspect')
  @HasRole()
  @ZodResponse({ type: DetailedUserResponseDto, status: HttpStatus.OK })
  introspectSession(
    @AuthedUser() user: { id: string; impersonation?: { id: string } },
  ): Promise<DetailedUserResponseDto> {
    return this.auth.detailsUser({
      userId: user.id,
      impersonationId: user.impersonation?.id,
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @HasRole()
  async logout(
    @AuthedUser()
    user: {
      id: string;
      sessionId: string;
      impersonation?: { id: string; impersonatorId: string };
    },
    @Res() response: ExpressResponse,
  ): Promise<void> {
    if (!user.sessionId && !user.impersonation) {
      throw new NotFoundException();
    }

    const { id: userId, sessionId, impersonation } = user;

    if (impersonation) {
      const { id: impersonationId, impersonatorId: userId } = impersonation;
      await this.auth.unImpersonate({
        userId,
        impersonationId,
      });
      this.unDecorateResponse(response, 'impersonationId').end();
      return;
    }

    await this.auth.unAuthenticate({ userId, sessionId });
    this.unDecorateResponse(response, 'sessionId').end();
  }

  @Post('register')
  @ApiExcludeEndpoint()
  @UsePipes(ZodValidationPipe)
  @UseGuards(DevelopmentEnvironmentGuard)
  @ZodResponse({ status: HttpStatus.CREATED, type: RegisteredUserDto })
  registerUser(@Body() body: RegisterUserDto): Promise<RegisteredUserDto> {
    return this.auth.registerUser({
      ...body,
      role: body.role ?? Role.MEMBRE_COMMUN,
    });
  }

  @Post('users/:userId/impersonations')
  @HttpCode(HttpStatus.NO_CONTENT)
  @HasRole(Role.ADMIN)
  async impersonate(
    @Param('userId') targetUserId: string,
    @Res() res: ExpressResponse,
    @AuthedUser() user: { id: string; sessionId: string },
  ): Promise<void> {
    const impersonation = await this.auth.impersonate({
      authSessionId: user.sessionId,
      userId: user.id,
      targetUserId,
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
