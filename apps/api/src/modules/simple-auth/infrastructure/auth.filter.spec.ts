import {
  Controller,
  Global,
  type INestApplication,
  Logger,
  Module,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';

import { ExceptionModule } from '../../framework/exception';
import { RequestEvent } from '../../framework/request-event';
import { UserNotImpersonable } from '../domain/auth-user';

import { AuthExceptionFilter } from './auth.filter';

const USER_ID = '7d2f4b1e-9a3c-4e8f-b6d0-1c5a8e2f9b4d';

@Controller()
@UseInterceptors(AuthExceptionFilter)
class ImpersonationController {
  @Post('users/:userId/impersonations')
  impersonate(): never {
    throw new UserNotImpersonable();
  }
}

@Global()
@Module({
  controllers: [ImpersonationController],
  exports: [RequestEvent],
  imports: [ClsModule.forRoot({ global: true }), ExceptionModule],
  providers: [RequestEvent],
})
class TestModule {}

describe('AuthExceptionFilter', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [TestModule] }).compile();
    app = module.createNestApplication({ logger: false });
    RequestEvent.mount(app);
    await app.listen(0);
  });

  afterAll(() => app.close());

  it('should answer within the route, so the request event keeps the identifiers of the route', async () => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    const response = await fetch(`${await app.getUrl()}/users/${USER_ID}/impersonations`, { method: 'POST' });
    const body: unknown = await response.json();
    await vi.waitFor(() => expect(write).toHaveBeenCalled());
    const event: unknown = JSON.parse(String(write.mock.calls[0]?.[0]));
    write.mockRestore();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ validationError: `Seul le compte actif d'un membre peut être usurpé` });
    expect(event).toMatchObject({ 'error.type': 'BadRequestException', 'fondation.user.id': USER_ID });
  });
});
