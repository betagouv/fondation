import { Feedback, FeedbackSent, FeedbackStatusChanged } from './feedback';

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
