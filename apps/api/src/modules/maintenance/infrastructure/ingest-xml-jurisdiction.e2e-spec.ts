import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { RootModule } from 'src/modules/root.module';
import { MaintenanceService } from './maintenance.service';
import { PrismaService } from 'src/modules/framework/database';

describe('IngestXmlJurisdiction', () => {
  let db: PrismaService;
  let app: INestApplication;
  let maintenance: MaintenanceService;

  beforeAll(async () => {
    const container = await Test.createTestingModule({
      imports: [RootModule],
    }).compile();
    app = container.createNestApplication();

    await app.init();

    db = app.get(PrismaService);
    maintenance = app.get(MaintenanceService);
  });

  afterAll(async () => {
    await db.$disconnect();
    await app.close();
  });

  it('should ingest a JURIDICTION xml', async () => {
    const codejur = randomUUID();
    const buffer = Buffer.from(
      `<?xml version="1.0" encoding="ISO-8895-1" ?>
       <lolfi>
           <juridictions num="1">
             <codejur>${codejur}</codejur>
             <type_jur>TI</type_jur>
             <libelle>Juridiction de Test 1</libelle>
             <srj>10000</srj>
             <date_suppression>01/01/2050</date_suppression>
            </juridictions>
            <juridictions num="2">
             <codejur>${codejur}-1</codejur>
             <type_jur>TI</type_jur>
             <libelle>Juridiction de Test 2</libelle>
             <srj>10001</srj>
             <date_suppression>01/01/2050</date_suppression>
           </juridictions>
       </lolfi>
      `,
      'latin1',
    );

    await maintenance.ingestXmlJurisdictions(buffer);

    const jurisdiction = await db.jurisdiction.findFirst({
      where: { codejur },
    });

    expect(jurisdiction).toMatchObject({
      codejur,
      typeJur: 'TI',
      libelle: 'Juridiction de Test 1',
      dateSuppression: new Date('2050-01-01'),
    });
  });
});
