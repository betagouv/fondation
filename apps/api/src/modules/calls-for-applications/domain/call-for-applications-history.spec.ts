import { DateOnly } from '../../../utils/date-only';

import type { CallForApplicationsChangedField } from './call-for-applications';
import { callForApplicationsChangedFieldEntriesOf } from './call-for-applications-history';

const NO_VALUE = { dateAfter: null, dateBefore: null, typeAfter: null, typeBefore: null };

describe('callForApplicationsChangedFieldEntriesOf', () => {
  const NONE = { added: [], removed: [] };
  const sentenceOf = (
    changed: Partial<CallForApplicationsChangedField>,
    items: { added?: string[]; removed?: string[] } = {},
  ) =>
    callForApplicationsChangedFieldEntriesOf(
      { ...NO_VALUE, change: 'CHANGED', field: 'DEADLINE', ...changed },
      {
        added: (items.added ?? []).map((label) => ({ label })),
        removed: (items.removed ?? []).map((label) => ({ label })),
      },
    )
      .map(({ change, label }) => `${change.label} ${label}`)
      .join(' | ');

  it.each([
    [{ change: 'ADDED', dateAfter: new DateOnly(2027, 1, 15) }, 'ajouté la date limite du 15/01/2027'],
    [{ change: 'REMOVED', dateBefore: new DateOnly(2027, 1, 10) }, 'retiré la date limite du 10/01/2027'],
    [
      { change: 'CHANGED', dateAfter: new DateOnly(2027, 1, 15), dateBefore: new DateOnly(2027, 1, 10) },
      'modifié la date limite du 10/01/2027 au 15/01/2027',
    ],
    [{ change: 'CHANGED' }, 'modifié la date limite'],
    [
      { change: 'CHANGED', field: 'TYPE', typeAfter: 'SPECIFIC', typeBefore: 'GENERAL' },
      "modifié le type d'appel de Général en Spécifique",
    ],
    [{ change: 'ADDED', field: 'COMMENT' }, 'ajouté un commentaire'],
  ] as const)('reads %j as %s', (changed, sentence) => {
    expect(sentenceOf(changed)).toBe(sentence);
  });

  it('names the courts added in the sentence with their article', () => {
    expect(
      sentenceOf(
        { change: 'ADDED', field: 'TARGET_COURTS' },
        { added: ["Tribunal judiciaire d'Auch", "Cour d'appel d'Agen"] },
      ),
    ).toBe("ajouté le tribunal judiciaire d'Auch et la cour d'appel d'Agen aux juridictions cibles");
  });

  it('elides the article of a position', () => {
    expect(
      sentenceOf({ change: 'REMOVED', field: 'TARGET_POSITIONS' }, { removed: ['Auditeur 2e grade'] }),
    ).toBe("retiré l'auditeur 2e grade des postes cibles");
  });

  it('keeps the code of a court without a label as it is', () => {
    expect(sentenceOf({ change: 'ADDED', field: 'TARGET_COURTS' }, { added: ['TJ  GRASSE'] })).toBe(
      'ajouté TJ  GRASSE aux juridictions cibles',
    );
  });

  it('tells both gestures when the courts were added and removed', () => {
    expect(
      sentenceOf(
        { change: 'CHANGED', field: 'TARGET_COURTS' },
        { added: ["Tribunal judiciaire d'Auch"], removed: ["Cour d'appel d'Agen"] },
      ),
    ).toBe("ajouté le tribunal judiciaire d'Auch | retiré la cour d'appel d'Agen");
  });

  it('counts the courts beyond three and leaves their names to the tooltip', () => {
    const entries = callForApplicationsChangedFieldEntriesOf(
      { ...NO_VALUE, change: 'ADDED', field: 'TARGET_COURTS' },
      { added: ['A', 'B', 'C', 'D'].map((label) => ({ label })), removed: [] },
    );

    expect(entries).toEqual([
      {
        change: { id: 'ADDED', label: 'ajouté' },
        label: '4 juridictions cibles',
        targets: { added: [{ label: 'A' }, { label: 'B' }, { label: 'C' }, { label: 'D' }], removed: [] },
      },
    ]);
  });

  it('keeps a list change journaled before its items were as it was', () => {
    expect(
      callForApplicationsChangedFieldEntriesOf(
        { ...NO_VALUE, change: 'CHANGED', field: 'TARGET_COURTS' },
        NONE,
      ),
    ).toMatchObject([{ label: 'les juridictions cibles', targets: null }]);
  });
});
