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

  it('is new until its status changes', () => {
    expect(Remark.statusOf([])).toBe('NEW');
    expect(Remark.statusOf([{ status: 'NEW' }, { status: 'PROCESSED' }])).toBe('NEW');
  });

  it('changes status', () => {
    const remark = Remark.from({ id: 'remark', status: 'NEW' });

    remark.changeStatus({ changedBy: 'admin', status: 'PROCESSED' });

    expect(remark.messages).toEqual([new RemarkStatusChanged('remark', 'PROCESSED', 'admin')]);
  });

  it('keeps no trace of a status set again', () => {
    const remark = Remark.from({ id: 'remark', status: 'DISMISSED' });

    remark.changeStatus({ changedBy: 'admin', status: 'DISMISSED' });

    expect(remark.messages).toEqual([]);
  });
});
