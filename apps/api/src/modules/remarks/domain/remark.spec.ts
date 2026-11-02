import { Remark, RemarkSent, RemarkStatusChanged } from './remark';

const SENT = { text: 'Ce libellé est trompeur', url: '/sessions?page=2' };

describe('Remark', () => {
  it('is sent by its author', () => {
    const remark = Remark.send({ ...SENT, sender: { id: 'member', impersonatorId: null } });

    expect(remark.messages).toEqual([new RemarkSent(remark.id, 'member', null, SENT.text, SENT.url)]);
  });

  it('is sent by the admin when impersonating, the account viewed kept aside', () => {
    const remark = Remark.send({ ...SENT, sender: { id: 'member', impersonatorId: 'admin' } });

    expect(remark.messages).toEqual([new RemarkSent(remark.id, 'admin', 'member', SENT.text, SENT.url)]);
  });

  it('changes status, with its comment', () => {
    const remark = Remark.from({ id: 'remark', status: { comment: null, value: 'NEW' } });

    remark.changeStatus({ changedBy: 'admin', status: { comment: 'Déjà prévu', value: 'DISMISSED' } });

    expect(remark.messages).toEqual([
      new RemarkStatusChanged('remark', { comment: 'Déjà prévu', value: 'DISMISSED' }, 'admin'),
    ]);
  });

  it('drops the comment once back to new', () => {
    const remark = Remark.from({ id: 'remark', status: { comment: 'Corrigé', value: 'PROCESSED' } });

    remark.changeStatus({ changedBy: 'admin', status: { comment: 'Corrigé', value: 'NEW' } });

    expect(remark.messages).toEqual([
      new RemarkStatusChanged('remark', { comment: null, value: 'NEW' }, 'admin'),
    ]);
  });

  it('keeps no trace of a status and comment set again', () => {
    const remark = Remark.from({ id: 'remark', status: { comment: 'Déjà prévu', value: 'DISMISSED' } });

    remark.changeStatus({ changedBy: 'admin', status: { comment: 'Déjà prévu', value: 'DISMISSED' } });

    expect(remark.messages).toEqual([]);
  });
});
