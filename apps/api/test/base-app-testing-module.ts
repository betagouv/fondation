import { TestingModuleBuilder, Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { FakeSignatureProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/fake-signature.provider';
import { CookieSignatureProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/hmac-signature.provider';
import { DRIZZLE_DB } from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { DrizzleDb } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { SessionValidationService } from 'src/shared-kernel/business-logic/gateways/services/session-validation.service';

export class BaseAppTestingModule {
  moduleFixture: TestingModuleBuilder;

  constructor(db: DrizzleDb) {
    this.moduleFixture = Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DRIZZLE_DB)
      .useValue(db);
  }

  withFakeCookieSignature(
    signedValuesMap?: FakeSignatureProvider['signedValuesMap'],
  ) {
    this.moduleFixture.overrideProvider(CookieSignatureProvider).useFactory({
      factory: () => {
        const signatureProvider = new FakeSignatureProvider();

        if (signedValuesMap)
          signatureProvider.signedValuesMap = signedValuesMap;

        return signatureProvider;
      },
    });

    return this;
  }

  withStubSessionValidationService(
    validated: boolean,
    stubUser = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      firstName: 'First-name',
      lastName: 'REPORTER',
    },
  ) {
    this.moduleFixture.overrideProvider(SessionValidationService).useClass(
      class StubSessionValidationService {
        async validateSession(): ReturnType<
          SessionValidationService['validateSession']
        > {
          return validated ? stubUser : null;
        }
      },
    );
    return this;
  }

  compile() {
    return this.moduleFixture.compile();
  }
}
