import { DateOnly } from '../../../utils/date-only';

import type { CallForApplicationsChangedField } from './call-for-applications';
import { callForApplicationsHistoryChangesOf } from './call-for-applications-history';

const NO_VALUE = { dateAfter: null, dateBefore: null, typeAfter: null, typeBefore: null };

type Field = Partial<CallForApplicationsChangedField> & { added?: string[]; removed?: string[] };

function changesOf(...fields: Field[]) {
  return callForApplicationsHistoryChangesOf(
    fields.map(({ added = [], removed = [], ...changed }) => ({
      ...NO_VALUE,
      change: 'CHANGED',
      field: 'DEADLINE',
      ...changed,
      items: { added: added.map((label) => ({ label })), removed: removed.map((label) => ({ label })) },
    })),
  );
}

function sentenceOf(...fields: Field[]): string {
  return changesOf(...fields)
    .map(({ change, label }) => `${change.label} ${label}`)
    .join(' | ');
}

describe('callForApplicationsHistoryChangesOf', () => {
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
  ] as const)('reads %j as %s', (field, sentence) => {
    expect(sentenceOf(field)).toBe(sentence);
  });

  it('gathers the fields under the verb they share', () => {
    expect(sentenceOf({ change: 'CHANGED' }, { change: 'CHANGED', field: 'COMMENT' })).toBe(
      'modifié la date limite et le commentaire',
    );
  });

  it('names the courts added in the sentence with their article', () => {
    expect(
      sentenceOf({
        change: 'ADDED',
        field: 'TARGET_COURTS',
        added: ["Tribunal judiciaire d'Auch", "Cour d'appel d'Agen"],
      }),
    ).toBe("ajouté le tribunal judiciaire d'Auch et la cour d'appel d'Agen aux juridictions cibles");
  });

  it('elides the article of a position', () => {
    expect(sentenceOf({ change: 'REMOVED', field: 'TARGET_POSITIONS', removed: ['Auditeur 2e grade'] })).toBe(
      "retiré l'auditeur 2e grade des postes cibles",
    );
  });

  it('keeps the code of a court without a label as it is', () => {
    expect(sentenceOf({ change: 'ADDED', field: 'TARGET_COURTS', added: ['TJ  GRASSE'] })).toBe(
      'ajouté TJ  GRASSE aux juridictions cibles',
    );
  });

  it('keeps the gestures on a list apart from a field that shares their verb', () => {
    expect(
      sentenceOf(
        {
          change: 'CHANGED',
          field: 'TARGET_COURTS',
          added: ["Tribunal judiciaire d'Auch"],
          removed: ["Cour d'appel d'Agen"],
        },
        { change: 'ADDED', field: 'COMMENT' },
      ),
    ).toBe("ajouté le tribunal judiciaire d'Auch | retiré la cour d'appel d'Agen | ajouté un commentaire");
  });

  it('counts the courts of a gesture beyond three and leaves their names to the tooltip', () => {
    expect(
      changesOf({
        change: 'CHANGED',
        field: 'TARGET_COURTS',
        added: ['A', 'B', 'C', 'D', 'E'],
        removed: ["Cour d'appel d'Agen"],
      }),
    ).toEqual([
      {
        change: { id: 'ADDED', label: 'ajouté' },
        label: '5 juridictions cibles',
        targets: ['A', 'B', 'C', 'D', 'E'].map((label) => ({ label })),
      },
      { change: { id: 'REMOVED', label: 'retiré' }, label: "la cour d'appel d'Agen", targets: null },
    ]);
  });

  it('reads a list change journaled before its items were like any other field', () => {
    expect(sentenceOf({ change: 'CHANGED', field: 'TARGET_COURTS' })).toBe('modifié les juridictions cibles');
  });
});
