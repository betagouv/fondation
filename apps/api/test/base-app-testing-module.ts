import { TestingModuleBuilder, Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
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

  compile() {
    return this.moduleFixture.compile();
  }
}
