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

  test('a tab opened before the renaming lists and filters an acknowledged feedback as new', async ({
    admin,
    member,
    expect,
  }) => {
    const text = `Pris en compte, vu d'un ancien onglet ${randomUUID()}`;
    await member.feedbacks.sendFeedback({ body: { text, url: '/transparences' } });
    await admin.feedbacks.changeFeedbackStatus({
      body: { comment: 'FON-771', status: 'ACKNOWLEDGED' },
      path: { feedbackId: (await findFeedback(admin, text))!.id },
    });

    const listed = await admin['@client'].get<{ 200: ListedFeedbacksDto }>({
      query: { limit: 200, statuses: ['NEW'] },
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

  test('the admin searches the feedbacks by their words, whatever the accents, the ligatures and the case', async ({
    admin,
    member,
    expect,
  }) => {
    const id = randomUUID();
    const text = `Le cœur de l’export du procès-verbal est coupé ${id}`;
    await member.feedbacks.sendFeedback({ body: { text, url: '/transparences' } });

    const found = await admin.feedbacks.listFeedbacks({
      query: { limit: 200, search: `CŒUR l’export PROCES-VERBAL ${id}` },
    });

    expect(found.data).toMatchObject({ items: [{ text }], totalCount: 1 });
  });

  test('the admin finds a feedback by the name of the one who sent it', async ({ admin, member, expect, sql }) => {
    const id = randomUUID();
    const text = `Il manque un export ${id}`;
    await member.feedbacks.sendFeedback({ body: { text, url: '/transparences' } });
    const [author] = await sql<{ last_name: string }[]>`
      select last_name from identity_and_access_context.users where id = ${member['@user']!.id}
    `;

    const listed = await admin.feedbacks.listFeedbacks({
      query: { limit: 200, search: `${author!.last_name.toUpperCase()} ${id}`, statuses: ['NEW'] },
    });

    expect(listed.data?.items.map((feedback) => feedback.text)).toEqual([text]);
  });

  test('the admin finds the feedbacks waiting for longer than a few days', async ({ admin, member, expect, sql }) => {
    const id = randomUUID();
    const waiting = `Envoyé il y a 20 jours ${id}`;
    const fresh = `Envoyé aujourd'hui ${id}`;
    for (const text of [fresh, waiting]) {
      await member.feedbacks.sendFeedback({ body: { text, url: '/transparences' } });
    }
    await sql`
      update nominations_context.feedback set sent_at = now() - interval '20 days' where text = ${waiting}
    `;

    const listed = await admin.feedbacks.listFeedbacks({
      query: { limit: 200, search: id, sentAgo: 'MORE_THAN_14_DAYS' },
    });

    expect(listed.data?.items.map((feedback) => feedback.text)).toEqual([waiting]);
  });

  test('the admin counts the feedbacks of every status found, whatever the status listed', async ({
    admin,
    member,
    expect,
  }) => {
    const id = randomUUID();
    const dismissed = `Écarté ${id}`;
    for (const text of [`Nouveau ${id}`, dismissed]) {
      await member.feedbacks.sendFeedback({ body: { text, url: '/transparences' } });
    }
    await admin.feedbacks.changeFeedbackStatus({
      body: { comment: null, status: 'DISMISSED' },
      path: { feedbackId: (await findFeedback(admin, dismissed))!.id },
    });

    const listed = await admin.feedbacks.listFeedbacks({ query: { limit: 200, search: id, statuses: ['NEW'] } });

    expect(listed.data?.statuses).toEqual([
      { count: 1, id: 'NEW' },
      { count: 0, id: 'ACKNOWLEDGED' },
      { count: 0, id: 'PROCESSED' },
      { count: 1, id: 'DISMISSED' },
    ]);
  });

  test('the admin pages through the feedbacks, the most recent first', async ({ admin, member, expect, sql }) => {
    const id = randomUUID();
    const texts = [`Il y a trois jours ${id}`, `Il y a deux jours ${id}`, `Hier ${id}`];
    for (const [index, text] of texts.entries()) {
      await member.feedbacks.sendFeedback({ body: { text, url: '/transparences' } });
      await sql`
        update nominations_context.feedback set sent_at = now() - ${3 - index} * interval '1 day' where text = ${text}
      `;
    }

    const second = await admin.feedbacks.listFeedbacks({ query: { limit: 2, page: 2, search: id } });

    expect(second.data).toMatchObject({ items: [{ text: texts[0] }], totalCount: 3 });
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
