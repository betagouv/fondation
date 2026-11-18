import { Feedback, FeedbackSent, FeedbackStatusChanged, sentBefore } from './feedback';

const SENT = { text: 'Ce libellé est trompeur', url: '/sessions?page=2' };

describe('Feedback', () => {
  it('is sent by its author', () => {
    const feedback = Feedback.send({ ...SENT, sender: { id: 'member', impersonatorId: null } });

    expect(feedback.messages).toEqual([new FeedbackSent(feedback.id, 'member', null, SENT.text, SENT.url)]);
  });

  it('is sent by the admin when impersonating, the account viewed kept aside', () => {
    const feedback = Feedback.send({ ...SENT, sender: { id: 'member', impersonatorId: 'admin' } });

    expect(feedback.messages).toEqual([
      new FeedbackSent(feedback.id, 'admin', 'member', SENT.text, SENT.url),
    ]);
  });

  it('changes status, with its comment', () => {
    const feedback = Feedback.from({ id: 'feedback', status: { comment: null, value: 'NEW' } });

    feedback.changeStatus({ changedBy: 'admin', status: { comment: 'Déjà prévu', value: 'DISMISSED' } });

    expect(feedback.messages).toEqual([
      new FeedbackStatusChanged('feedback', { comment: 'Déjà prévu', value: 'DISMISSED' }, 'admin'),
    ]);
  });

  it('keeps its comment once back to new', () => {
    const feedback = Feedback.from({ id: 'feedback', status: { comment: 'Corrigé', value: 'PROCESSED' } });

    feedback.changeStatus({ changedBy: 'admin', status: { comment: 'Corrigé', value: 'NEW' } });

    expect(feedback.messages).toEqual([
      new FeedbackStatusChanged('feedback', { comment: 'Corrigé', value: 'NEW' }, 'admin'),
    ]);
  });

  it('keeps no trace of a status and comment set again', () => {
    const feedback = Feedback.from({ id: 'feedback', status: { comment: 'Déjà prévu', value: 'DISMISSED' } });

    feedback.changeStatus({ changedBy: 'admin', status: { comment: 'Déjà prévu', value: 'DISMISSED' } });

    expect(feedback.messages).toEqual([]);
  });
});

describe('sentBefore', () => {
  const now = new Date('2026-11-17T10:00:00Z');

  it.each([
    ['MORE_THAN_7_DAYS', '2026-11-10T10:00:00.000Z'],
    ['MORE_THAN_14_DAYS', '2026-11-03T10:00:00.000Z'],
    ['MORE_THAN_21_DAYS', '2026-10-27T10:00:00.000Z'],
    ['MORE_THAN_1_MONTH', '2026-10-17T10:00:00.000Z'],
    ['MORE_THAN_2_MONTHS', '2026-09-17T10:00:00.000Z'],
  ] as const)('puts a feedback sent %s ago before that instant', (age, instant) => {
    expect(sentBefore(age, now).toISOString()).toBe(instant);
  });

  it('stops at the end of a shorter month, rather than spilling into the next one', () => {
    expect(sentBefore('MORE_THAN_1_MONTH', new Date('2026-03-31T10:00:00Z')).toISOString()).toBe(
      '2026-02-28T10:00:00.000Z',
    );
  });
});
