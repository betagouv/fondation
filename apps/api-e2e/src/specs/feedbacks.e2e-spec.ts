import { randomUUID } from 'node:crypto';

import { test } from '../fixtures.ts';
import type { ChangeFeedbackStatusDto, ListedFeedbacksDto } from '../generated/api/types.ts';
import type { TestStepsAdmin } from '../steps.ts';

type FeedbackStatus = ChangeFeedbackStatusDto['status'];

async function findFeedback(admin: TestStepsAdmin, text: string, statuses?: FeedbackStatus[]) {
  const listed = await admin.feedbacks.listFeedbacks({ query: { limit: 200, statuses } });
  return listed.data?.items.find((feedback) => feedback.text === text);
}

test.describe('Feedbacks E2E', () => {
  test('a member sends a feedback, which the admin finds with its page to reopen as the member', async ({
    admin,
    member,
    expect,
  }) => {
    const text = `Ce libellé est trompeur ${randomUUID()}`;

    const sent = await member.feedbacks.sendFeedback({ body: { text, url: '/sessions?page=2' } });
    expect(sent.response?.status).toBe(204);

    expect(await findFeedback(admin, text)).toMatchObject({
      author: { id: member['@user']?.id },
      impersonated: null,
      openAs: { id: member['@user']?.id },
      status: { changedAt: null, changedBy: null, comment: null, value: 'NEW' },
      url: '/sessions?page=2',
    });
  });

  test('a tab opened before the renaming still sends a feedback at its former route', async ({
    admin,
    member,
    expect,
  }) => {
    const text = `Envoyé depuis un ancien onglet ${randomUUID()}`;

    const sent = await member['@client'].post({
      body: { text, url: '/transparences' },
      headers: { 'Content-Type': 'application/json' },
      url: '/api/remarks/v1',
    });

    expect(sent.response?.status).toBe(204);
    expect(await findFeedback(admin, text)).toMatchObject({ author: { id: member['@user']?.id } });
  });

  test('the admin processes a feedback, which leaves the new ones and keeps who did it', async ({
    admin,
    agent,
    expect,
    sql,
  }) => {
    const text = `Il manque le tri par grade ${randomUUID()}`;
    await agent.feedbacks.sendFeedback({ body: { text, url: '/transparences' } });
    const feedback = await findFeedback(admin, text);

    const changed = await admin.feedbacks.changeFeedbackStatus({
      body: { comment: 'Corrigé en production le 15/11', status: 'PROCESSED' },
      path: { feedbackId: feedback!.id },
    });
    expect(changed.response?.status).toBe(204);

    expect(await findFeedback(admin, text, ['NEW'])).toBeUndefined();
    expect(await findFeedback(admin, text, ['PROCESSED'])).toMatchObject({
      status: {
        changedAt: expect.any(String),
        changedBy: { id: admin['@user']?.id },
        comment: 'Corrigé en production le 15/11',
        value: 'PROCESSED',
      },
    });
    // the history is kept for the record only: the application never shows it
    const history = await sql`
      select changed_by, comment, status from nominations_context.feedback_status_change where feedback_id = ${feedback!.id}
    `;
    expect(history).toEqual([
      { changed_by: admin['@user']?.id, comment: 'Corrigé en production le 15/11', status: 'PROCESSED' },
    ]);
  });

  test('a tab opened before the renaming lists an acknowledged feedback as new', async ({ admin, member, expect }) => {
    const text = `Pris en compte, vu d'un ancien onglet ${randomUUID()}`;
    await member.feedbacks.sendFeedback({ body: { text, url: '/transparences' } });
    await admin.feedbacks.changeFeedbackStatus({
      body: { comment: 'FON-771', status: 'ACKNOWLEDGED' },
      path: { feedbackId: (await findFeedback(admin, text))!.id },
    });

    const listed = await admin['@client'].get<{ 200: ListedFeedbacksDto }>({
      query: { limit: 200 },
      url: '/api/remarks/v1',
    });

    expect(listed.data?.items.find((feedback) => feedback.text === text)?.status).toMatchObject({
      comment: 'FON-771',
      value: 'NEW',
    });
  });

  test('the same status change sent twice at once is recorded once', async ({ admin, agent, expect, sql }) => {
    const text = `Envoyé deux fois ${randomUUID()}`;
    await agent.feedbacks.sendFeedback({ body: { text, url: '/transparences' } });
    const feedback = await findFeedback(admin, text);
    const change = () =>
      admin.feedbacks.changeFeedbackStatus({
        body: { comment: 'FON-771', status: 'ACKNOWLEDGED' },
        path: { feedbackId: feedback!.id },
      });

    const responses = await Promise.all([change(), change()]);

    expect(responses.map(({ response }) => response?.status)).toEqual([204, 204]);
    const history = await sql`
      select status from nominations_context.feedback_status_change where feedback_id = ${feedback!.id}
    `;
    expect(history).toEqual([{ status: 'ACKNOWLEDGED' }]);
  });

  test('the admin sorts the feedbacks by status, in the order of the list', async ({ admin, member, expect }) => {
    const acknowledged = `Pris en compte ${randomUUID()}`;
    const dismissed = `Écarté ${randomUUID()}`;
    const fresh = `Nouveau ${randomUUID()}`;
    const processed = `Traité ${randomUUID()}`;
    for (const text of [acknowledged, dismissed, fresh, processed]) {
      await member.feedbacks.sendFeedback({ body: { text, url: '/transparences' } });
    }
    for (const [text, status] of [
      [acknowledged, 'ACKNOWLEDGED'],
      [dismissed, 'DISMISSED'],
      [processed, 'PROCESSED'],
    ] as const) {
      await admin.feedbacks.changeFeedbackStatus({
        body: { comment: null, status },
        path: { feedbackId: (await findFeedback(admin, text))!.id },
      });
    }

    const listed = await admin.feedbacks.listFeedbacks({ query: { limit: 200, sortBy: 'status', sortDesc: false } });

    const texts = listed.data!.items.map(({ text }) => text);
    const positions = [fresh, acknowledged, processed, dismissed].map((text) => texts.indexOf(text));
    expect(positions).not.toContain(-1);
    expect(positions).toEqual(positions.toSorted((a, b) => a - b));
  });
});
