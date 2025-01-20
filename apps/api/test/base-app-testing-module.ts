import { TestingModuleBuilder, Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { FakeSignatureProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/fake-signature.provider';
import { CookieSignatureProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/hmac-signature.provider';
import { DRIZZLE_DB } from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { DrizzleDb } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';

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

  compile() {
    return this.moduleFixture.compile();
  }
}
