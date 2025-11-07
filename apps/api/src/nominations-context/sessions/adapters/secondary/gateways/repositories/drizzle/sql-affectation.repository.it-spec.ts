import omit from 'lodash/omit';
import { faker } from '@faker-js/faker';
import { randomBytes, randomUUID } from 'node:crypto';
import { Magistrat, PrioriteEnum } from 'shared-models';
import {
  dossierDeNominationPm,
  users,
} from 'src/modules/framework/drizzle/schemas';
import { Affectation } from 'src/nominations-context/sessions/business-logic/models/affectation';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { sessionPm } from './schema';
import { SqlAffectationRepository } from './sql-affectation.repository';
import { DomainRegistry } from 'src/shared-kernel/business-logic/models/domain-registry';

describe('SQL Affectation Repository', () => {
  let db: DrizzleDb;
  let sqlAffectationRepository: SqlAffectationRepository;

  beforeAll(() => {
    DomainRegistry.setUuidGenerator({
      generate: () => randomUUID(),
    });

    db = getDrizzleInstance(drizzleConfigForTest);
    sqlAffectationRepository = new SqlAffectationRepository();
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('saves an affectation', async () => {
    await db.transaction(async (tx) => {
      const rapporteurId = randomUUID();
      await tx.insert(users).values({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: randomBytes(32).toString('hex'),
        email: faker.internet.email(),
        gender: 'MALE',
        role: 'MEMBRE_COMMUN',
        id: rapporteurId,
      });

      const sessionId = randomUUID();
      await tx.insert(sessionPm).values({
        id: sessionId,
        formation: Magistrat.Formation.PARQUET,
        name: faker.lorem.words(3),
        sessionImportéeId: randomUUID(),
        typeDeSaisine: 'TRANSPARENCE_GDS',
        content: {},
      });

      const dossierDeNominationId = randomUUID();
      await tx.insert(dossierDeNominationPm).values({
        content: {},
        sessionId,
        dossierDeNominationImportéId: randomUUID(),
        id: dossierDeNominationId,
      });

      const affectation = Affectation.nouvelle(
        sessionId,
        Magistrat.Formation.PARQUET,
        [
          {
            dossierDeNominationId,
            rapporteurIds: [rapporteurId],
            priorite: PrioriteEnum.OUTRE_MER,
          },
        ],
      );

      await sqlAffectationRepository.save(affectation)(tx);

      const persistedAffectation =
        await sqlAffectationRepository.bySessionId(sessionId)(tx);

      expect(omit(persistedAffectation, '_id')).toEqual(
        omit(affectation, '_id'),
      );
    });
  });
});
