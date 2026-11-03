import { randomUUID } from 'node:crypto';

import { test } from '../fixtures.ts';
import type { ChangeRemarkStatusDto } from '../generated/api/types.ts';
import type { TestStepsAdmin } from '../steps.ts';

type RemarkStatus = ChangeRemarkStatusDto['status'];

async function findRemark(admin: TestStepsAdmin, text: string, statuses?: RemarkStatus[]) {
  const listed = await admin.remarks.listRemarks({ query: { limit: 200, statuses } });
  return listed.data?.items.find((remark) => remark.text === text);
}

test.describe('Remarks E2E', () => {
  test('a member sends a remark, which the admin finds with its page to reopen as the member', async ({
    admin,
    member,
    expect,
  }) => {
    const text = `Ce libellé est trompeur ${randomUUID()}`;

    const sent = await member.remarks.sendRemark({ body: { text, url: '/sessions?page=2' } });
    expect(sent.response?.status).toBe(204);

    expect(await findRemark(admin, text)).toMatchObject({
      author: { id: member['@user']?.id },
      impersonated: null,
      openAs: { id: member['@user']?.id },
      status: { changedAt: null, changedBy: null, comment: null, value: 'NEW' },
      url: '/sessions?page=2',
    });
  });

  test('the admin processes a remark, which leaves the new ones and keeps who did it', async ({
    admin,
    agent,
    expect,
    sql,
  }) => {
    const text = `Il manque le tri par grade ${randomUUID()}`;
    await agent.remarks.sendRemark({ body: { text, url: '/transparences' } });
    const remark = await findRemark(admin, text);

    const changed = await admin.remarks.changeRemarkStatus({
      body: { comment: 'Corrigé en production le 15/11', status: 'PROCESSED' },
      path: { remarkId: remark!.id },
    });
    expect(changed.response?.status).toBe(204);

    expect(await findRemark(admin, text, ['NEW'])).toBeUndefined();
    expect(await findRemark(admin, text, ['PROCESSED'])).toMatchObject({
      status: {
        changedAt: expect.any(String),
        changedBy: { id: admin['@user']?.id },
        comment: 'Corrigé en production le 15/11',
        value: 'PROCESSED',
      },
    });
    // the history is kept for the record only: the application never shows it
    const history = await sql`
      select changed_by, comment, status from nominations_context.remark_status_change where remark_id = ${remark!.id}
    `;
    expect(history).toEqual([
      { changed_by: admin['@user']?.id, comment: 'Corrigé en production le 15/11', status: 'PROCESSED' },
    ]);
  });

  test('the admin sorts the remarks by status, in the order of the list', async ({ admin, member, expect }) => {
    const dismissed = `Écartée ${randomUUID()}`;
    const fresh = `Nouvelle ${randomUUID()}`;
    await member.remarks.sendRemark({ body: { text: dismissed, url: '/transparences' } });
    await member.remarks.sendRemark({ body: { text: fresh, url: '/transparences' } });
    await admin.remarks.changeRemarkStatus({
      body: { comment: null, status: 'DISMISSED' },
      path: { remarkId: (await findRemark(admin, dismissed))!.id },
    });

    const listed = await admin.remarks.listRemarks({ query: { limit: 200, sortBy: 'status', sortDesc: false } });

    const texts = listed.data!.items.map(({ text }) => text);
    expect(texts.indexOf(fresh)).toBeLessThan(texts.indexOf(dismissed));
  });
});
