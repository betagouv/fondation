import * as crypto from 'node:crypto';

import type { Sql } from 'postgres';

import { test } from '../fixtures.ts';
import type { LolfiFixture } from '../fixtures/lolfi.fixture.ts';
import { magistrats } from '../generated/api/sdk.ts';
import * as seed from '../utils/seed.ts';

function randomEmail(): string {
  return `${crypto.randomUUID()}@exemple.fr`;
}

async function ingestMagistrat(lolfi: LolfiFixture, sql: Sql): Promise<string> {
  const lolfiEmail = randomEmail();
  await lolfi.ingest([
    {
      candidates: [
        {
          email: lolfiEmail,
          firstName: 'ETIENNE',
          id: crypto.randomInt(1_000, 900_000),
          lastName: 'TREVOUX',
          position: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  LYON'] },
          targetPosition: {
            function: seed.functions.PR,
            grade: 'G3',
            jurisdiction: seed.jurisdictions['CA  GRENOBLE'],
          },
        },
      ],
      createdAt: '22/04/2026',
    },
  ]);
  const [magistrat] = await sql<{ id: string }[]>`
    select id from data_administration_context.magistrat where professional_email = ${lolfiEmail}
  `;
  return magistrat!.id;
}

test.describe('unrecognised magistrat emails', () => {
  test('should show the pole an address the website could not identify', async ({ agent, apiClients, expect }) => {
    const email = randomEmail();
    const site = await apiClients.authenticated({ scopes: ['magistrats:identification'] });

    await magistrats.identifyMagistrat({ body: { email: email.toUpperCase() }, client: site.http });

    const { data } = await agent.magistrats.listUnrecognisedMagistratEmails({ throwOnError: true });
    expect(data.items.find((item) => item.email === email)).toEqual({
      email,
      id: expect.any(String),
      lastAttemptAt: expect.any(String),
    });
  });

  test('should sort the addresses by the column picked', async ({ agent, apiClients, expect }) => {
    const prefix = crypto.randomUUID();
    const emails = [`${prefix}-a@exemple.fr`, `${prefix}-b@exemple.fr`];
    const site = await apiClients.authenticated({ scopes: ['magistrats:identification'] });
    for (const email of emails) await magistrats.identifyMagistrat({ body: { email }, client: site.http });
    const listed = (sortBy?: 'email' | 'lastAttemptAt', sortDesc?: 'true') =>
      agent.magistrats
        .listUnrecognisedMagistratEmails({ query: { limit: 200, sortBy, sortDesc }, throwOnError: true })
        .then(({ data }) => data.items.map((item) => item.email).filter((email) => email.startsWith(prefix)));

    expect({ byEmail: await listed('email'), latestFirst: await listed() }).toEqual({
      byEmail: [emails[0], emails[1]],
      latestFirst: [emails[1], emails[0]],
    });
  });

  test('should no longer show an attempt older than 30 days', async ({ agent, expect, sql }) => {
    const email = randomEmail();
    await sql`
      insert into identity_and_access_context.unrecognised_magistrat_email (email, id, last_attempt_at)
      values (${email}, ${crypto.randomUUID()}, now() - interval '31 days')
    `;

    const { data } = await agent.magistrats.listUnrecognisedMagistratEmails({
      query: { limit: 200 },
      throwOnError: true,
    });

    expect(data.items.some((item) => item.email === email)).toBe(false);
  });

  test('should identify a magistrat by the address the pole attached', async ({
    agent,
    apiClients,
    expect,
    lolfi,
    sql,
  }) => {
    const email = randomEmail();
    const magistratId = await ingestMagistrat(lolfi, sql);
    const site = await apiClients.authenticated({ scopes: ['magistrats:identification'] });
    await magistrats.identifyMagistrat({ body: { email }, client: site.http });
    const listed = await agent.magistrats.listUnrecognisedMagistratEmails({ throwOnError: true });
    const unrecognised = listed.data.items.find((item) => item.email === email)!;

    await agent.magistrats.attachUnrecognisedMagistratEmail({
      body: { magistratId: magistratId },
      path: { id: unrecognised.id },
      throwOnError: true,
    });

    const identified = await magistrats.identifyMagistrat({ body: { email }, client: site.http });
    const after = await agent.magistrats.listUnrecognisedMagistratEmails({ throwOnError: true });
    expect({
      identified: identified.data,
      listed: after.data.items.some((item) => item.email === email),
    }).toEqual({ identified: { magistrat: { id: magistratId }, status: 'ACTIVE' }, listed: false });
  });

  test('should no longer show an address the pole set aside', async ({ agent, apiClients, expect }) => {
    const email = randomEmail();
    const site = await apiClients.authenticated({ scopes: ['magistrats:identification'] });
    await magistrats.identifyMagistrat({ body: { email }, client: site.http });
    const listed = await agent.magistrats.listUnrecognisedMagistratEmails({ throwOnError: true });

    await agent.magistrats.dismissUnrecognisedMagistratEmail({
      path: { id: listed.data.items.find((item) => item.email === email)!.id },
      throwOnError: true,
    });

    const { data } = await agent.magistrats.listUnrecognisedMagistratEmails({ throwOnError: true });
    expect(data.items.some((item) => item.email === email)).toBe(false);
  });

  test('should tell a member of the pole that a colleague already handled the address', async ({
    agent,
    apiClients,
    expect,
  }) => {
    const email = randomEmail();
    const site = await apiClients.authenticated({ scopes: ['magistrats:identification'] });
    await magistrats.identifyMagistrat({ body: { email }, client: site.http });
    const listed = await agent.magistrats.listUnrecognisedMagistratEmails({ throwOnError: true });
    const path = { id: listed.data.items.find((item) => item.email === email)!.id };
    await agent.magistrats.dismissUnrecognisedMagistratEmail({ path, throwOnError: true });

    const { error, response } = await agent.magistrats.dismissUnrecognisedMagistratEmail({ path });

    expect({ error, status: response?.status }).toEqual({
      error: expect.objectContaining({ validationError: 'Cette adresse a déjà été traitée' }),
      status: 409,
    });
  });

  test('should no longer identify a magistrat by the address the pole detached', async ({
    agent,
    apiClients,
    expect,
    lolfi,
    sql,
  }) => {
    const email = randomEmail();
    const magistratId = await ingestMagistrat(lolfi, sql);
    const site = await apiClients.authenticated({ scopes: ['magistrats:identification'] });
    await magistrats.identifyMagistrat({ body: { email }, client: site.http });
    const listed = await agent.magistrats.listUnrecognisedMagistratEmails({ throwOnError: true });
    await agent.magistrats.attachUnrecognisedMagistratEmail({
      body: { magistratId },
      path: { id: listed.data.items.find((item) => item.email === email)!.id },
      throwOnError: true,
    });
    const attached = await agent.magistrats.listMagistratAttachedEmails({ path: { magistratId }, throwOnError: true });

    await agent.magistrats.detachMagistratEmail({
      path: { attachedEmailId: attached.data.items[0]!.id, magistratId },
      throwOnError: true,
    });

    const identified = await magistrats.identifyMagistrat({ body: { email }, client: site.http });
    const after = await agent.magistrats.listMagistratAttachedEmails({ path: { magistratId }, throwOnError: true });
    expect({ attached: attached.data.items, after: after.data.items, identified: identified.data }).toEqual({
      after: [],
      attached: [
        {
          attachedAt: expect.any(String),
          attachedBy: { id: agent['@user']!.id, name: expect.any(String) },
          email,
          id: expect.any(String),
        },
      ],
      identified: { status: 'UNKNOWN' },
    });
  });
});
