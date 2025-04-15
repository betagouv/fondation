import { HttpStatus, INestApplication } from '@nestjs/common';
import { users } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/drizzle/schema/user-pm';
import { FileModel } from 'src/identity-and-access-context/business-logic/models/file';
import { Gender } from 'src/identity-and-access-context/business-logic/models/gender';
import { Role } from 'shared-models';
import { UserSnapshot } from 'src/identity-and-access-context/business-logic/models/user';
import { FileType } from 'src/identity-and-access-context/business-logic/use-cases/file-read-permission/has-read-file-permission.use-case';
import { MainAppConfigurator } from 'src/main.configurator';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import supertest from 'supertest';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { clearDB } from 'test/docker-postgresql-manager';
import { SecureCrossContextRequestBuilder } from 'test/secure-cross-context-request.builder';
import { files } from '../../secondary/gateways/repositories/drizzle/schema';

const aPassword = 'password-123';
const aReporterUser: UserSnapshot = {
  id: 'f8e4f8e4-4f5b-4c8b-9b2d-e7b8a9d6e7b8',
  createdAt: new Date(),
  firstName: 'luc',
  lastName: 'denan',
  email: 'user@example.com',
  password: 'encrypted-password-123',
  role: Role.MEMBRE_COMMUN,
  gender: Gender.M,
};
const aFile: FileModel = {
  fileId: '95bea7cd-8ea7-4fa4-8919-aabc4f566b08',
  type: FileType.PIECE_JOINTE_TRANSPARENCE,
};

describe('Authz Controller - Files permissions', () => {
  let app: INestApplication;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    await db.insert(users).values(aReporterUser).execute();
    await db.insert(files).values(aFile).execute();

    const moduleFixture = await new AppTestingModule().compile();
    app = new MainAppConfigurator(
      moduleFixture.createNestApplication(),
    ).configure();

    await app.init();
  });

  afterEach(async () => await app.close());
  afterAll(async () => await db.$client.end());

  it('requires authentication to ask a permission', async () => {
    await supertest(app.getHttpServer())
      .get(`/api/authz/user/${aReporterUser.id}/can-read-file/${aFile.fileId}`)
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('allows a reporter to read a file', async () => {
    const response = await requestEndpoint(
      `user/${aReporterUser.id}/can-read-file/${aFile.fileId}`,
    ).expect(HttpStatus.OK);

    expect(response.text).toEqual('true');
  });

  const requestEndpoint = (pathname: string) =>
    new SecureCrossContextRequestBuilder(app)
      .withTestedEndpoint((agent) => agent.get(`/api/authz/${pathname}`))
      .request();

  class AppTestingModule extends BaseAppTestingModule {
    constructor() {
      super(db);
      this.withFakeEncryption({
        aPassword,
        aPasswordEncrypted: aReporterUser.password,
      });
    }
  }
});
