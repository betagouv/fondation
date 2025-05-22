import { INestApplication } from '@nestjs/common';
import { PermissionsService } from 'src/files-context/business-logic/services/permissions.service';
import { HasReadFilePermissionUseCase } from 'src/identity-and-access-context/business-logic/use-cases/file-read-permission/has-read-file-permission.use-case';
import { MainAppConfigurator } from 'src/main.configurator';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { PERMISSIONS_SERVICE } from '../../primary/nestjs/tokens';

const userId = '1e9e2140-d6a8-42ea-9976-8e0575976033';
const fileId = '2a7b3c5d-8c9d-4e5f-a6b7-c8d9e0f1a2b3';
const canReadFile = true;

describe('Permissions Service', () => {
  let app: INestApplication;
  let db: DrizzleDb;
  let permissionsService: PermissionsService;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    const moduleFixture = await new AppTestingModule()
      .withStubbedIdentityAndAccessContextUseCases()
      .compile();
    app = new MainAppConfigurator(
      moduleFixture.createNestApplication(),
    ).configure();

    permissionsService =
      await moduleFixture.resolve<PermissionsService>(PERMISSIONS_SERVICE);

    await app.init();
    await app.listen(defaultApiConfig.port);
  });

  afterEach(async () => await app.close());
  afterAll(async () => await db.$client.end());

  it('checks if a user can read a file', async () => {
    const hasPermission = await permissionsService.userCanRead({
      userId,
      fileId,
    });

    expect(hasPermission).toBe(canReadFile);
  });

  class AppTestingModule extends BaseAppTestingModule {
    constructor() {
      super(db);
    }

    withStubbedIdentityAndAccessContextUseCases() {
      this.moduleFixture
        .overrideProvider(HasReadFilePermissionUseCase)
        .useFactory({
          factory: () => ({
            execute: () => canReadFile,
          }),
        });

      return this;
    }
  }
});
