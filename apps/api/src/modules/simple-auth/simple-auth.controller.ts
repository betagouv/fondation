import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
  Res,
  UseFilters,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBasicAuth,
  ApiBody,
  ApiConsumes,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  type CookieOptions,
  type Request as ExpressRequest,
  type Response as ExpressResponse,
} from 'express';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';

import { AuthSession } from './domain/auth-session';
import { AuthExceptionFilter } from './infrastructure/auth.filter';
import { LoginDto } from './infrastructure/dto/auth.dto';
import { DetailedUserResponseDto } from './infrastructure/queries/details-user.query';
import { AuthedUserId, HasRole } from './simple-auth.decorator';
import { SimpleAuthService } from './simple-auth.service';

@ApiTags('Auth')
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
    this.decorateResponse({ res, session }).end();
  }

  @Get('introspect')
  @HasRole()
  @ZodResponse({ type: DetailedUserResponseDto, status: HttpStatus.OK })
  introspectSession(
    @AuthedUserId() userId: string,
  ): Promise<DetailedUserResponseDto> {
    return this.auth.detailsUser({ userId });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @HasRole()
  async logout(
    @AuthedUserId() userId: string,
    @Req() request: ExpressRequest,
    @Res() response: ExpressResponse,
  ): Promise<void> {
    const sessionId = request.signedCookies['sessionId'];

    if (!sessionId) {
      throw new NotFoundException();
    }

    await this.auth.unAuthenticate({ userId, sessionId });
    this.unDecorateResponse(response).end();
  }

  private decorateResponse(props: {
    res: ExpressResponse;
    session: AuthSession;
  }): ExpressResponse {
    return props.res.cookie('sessionId', props.session.id, {
      ...SimpleAuthController.COOKIE_OPTIONS,
      expires: props.session.expiresAt,
    });
  }

  private unDecorateResponse(res: ExpressResponse): ExpressResponse {
    return res.clearCookie('sessionId', SimpleAuthController.COOKIE_OPTIONS);
  }
}
