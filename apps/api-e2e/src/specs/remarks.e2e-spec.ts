import { randomUUID } from 'node:crypto';

import { test } from '../fixtures.ts';
import type { TestStepsAdmin } from '../steps.ts';

async function findRemark(admin: TestStepsAdmin, text: string) {
  const listed = await admin.remarks.listRemarks({ query: { limit: 200 } });
  return listed.data?.items.find((remark) => remark.text === text);
}

test.describe('Remarks E2E', () => {
  test('a member sends a remark, which the admin finds with its page', async ({ admin, member, expect }) => {
    const text = `Ce libellé est trompeur ${randomUUID()}`;

    const sent = await member.remarks.sendRemark({ body: { text, url: '/sessions?page=2' } });
    expect(sent.response?.status).toBe(204);

    expect(await findRemark(admin, text)).toMatchObject({
      author: { id: member['@user']?.id },
      impersonated: null,
      status: 'NEW',
      statusChanges: [],
      url: '/sessions?page=2',
    });
  });

  test('the admin processes a remark, which keeps who did it', async ({ admin, agent, expect }) => {
    const text = `Il manque le tri par grade ${randomUUID()}`;
    await agent.remarks.sendRemark({ body: { text, url: '/transparences' } });
    const remark = await findRemark(admin, text);

    const changed = await admin.remarks.changeRemarkStatus({
      body: { status: 'PROCESSED' },
      path: { remarkId: remark!.id },
    });
    expect(changed.response?.status).toBe(204);

    expect(await findRemark(admin, text)).toMatchObject({
      status: 'PROCESSED',
      statusChanges: [{ by: { id: admin['@user']?.id }, status: 'PROCESSED' }],
    });
  });
});
