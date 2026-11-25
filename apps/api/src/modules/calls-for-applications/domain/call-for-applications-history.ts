import { frenchDate } from '../../../utils/french-date';
import { lowerFirst, requiresElision } from '../../../utils/french-words';

import {
  type AddedAndRemoved,
  type CallForApplicationsChangedField,
  type CallForApplicationsField,
  type CallForApplicationsFieldChange,
  callForApplicationsTypeOf,
} from './call-for-applications';

const LIST_FORMAT = new Intl.ListFormat('fr');

/** the history reads "a ajouté un commentaire et modifié la date limite du 10/01/2027 au 15/01/2027" */
const FIELD_CHANGE_LABELS: Record<CallForApplicationsFieldChange, string> = {
  ADDED: 'ajouté',
  CHANGED: 'modifié',
  REMOVED: 'retiré',
};

/** the same label whatever the change */
function always(label: string): Record<CallForApplicationsFieldChange, string> {
  return { ADDED: label, CHANGED: label, REMOVED: label };
}

/** an added comment takes an indefinite article: "ajouté un commentaire" */
const FIELD_LABELS: Record<CallForApplicationsField, Record<CallForApplicationsFieldChange, string>> = {
  COMMENT: { ADDED: 'un commentaire', CHANGED: 'le commentaire', REMOVED: 'le commentaire' },
  DEADLINE: always('la date limite'),
  PUBLISHED_ON: always('la date de publication'),
  TARGET_COURTS: always('les juridictions cibles'),
  TARGET_POSITIONS: always('les postes cibles'),
  TYPE: always("le type d'appel"),
};

/** the values journaled with the field (none for a change journaled before they were) */
function valuesOf(changed: CallForApplicationsChangedField): string {
  const { dateAfter, dateBefore, typeAfter, typeBefore } = changed;
  if (dateBefore && dateAfter) return ` du ${frenchDate(dateBefore)} au ${frenchDate(dateAfter)}`;
  const date = dateAfter ?? dateBefore;
  if (date) return ` du ${frenchDate(date)}`;
  if (typeBefore && typeAfter)
    return ` de ${callForApplicationsTypeOf(typeBefore).label} en ${callForApplicationsTypeOf(typeAfter).label}`;
  return '';
}

/** beyond this count the history names the courts or the positions in a tooltip rather than in its sentence */
const NAMED_ITEMS_MAX = 3;

/** the words of a list field once its items are named: "aux juridictions cibles" */
const LIST_WORDS: Partial<
  Record<CallForApplicationsField, { added: string; count: string; removed: string }>
> = {
  TARGET_COURTS: {
    added: 'aux juridictions cibles',
    count: 'juridictions cibles',
    removed: 'des juridictions cibles',
  },
  TARGET_POSITIONS: { added: 'aux postes cibles', count: 'postes cibles', removed: 'des postes cibles' },
};

/** a court or a position the change journaled */
export type ChangedItem = { label: string };

/** with its article: "la cour d'appel d'Agen" or "l'auditeur 2e grade" (a court of appeal is the only feminine) */
function inSentence({ label }: ChangedItem): string {
  // a court without a label in the referential shows its code ("TJ  GRASSE") which takes no article
  if (label === label.toUpperCase()) return label;
  if (requiresElision(label)) return `l'${lowerFirst(label)}`;
  return `${label.startsWith('Cour') ? 'la' : 'le'} ${lowerFirst(label)}`;
}

function entryOf(change: CallForApplicationsFieldChange, label: string) {
  return { change: { id: change, label: FIELD_CHANGE_LABELS[change] }, label };
}

type HistoryEntry = {
  change: { id: CallForApplicationsFieldChange; label: string };
  /** the field as the sentence names it after the verb with its values or its items */
  label: string;
  /** the courts or the positions too many to name in the sentence */
  targets: { added: ChangedItem[]; removed: ChangedItem[] } | null;
};

/** the entries of the history for a changed field
 * (a list changed both ways reads "ajouté le tribunal judiciaire d'Auch et retiré la cour d'appel d'Agen") */
export function callForApplicationsChangedFieldEntriesOf(
  changed: CallForApplicationsChangedField,
  items: AddedAndRemoved<ChangedItem>,
): HistoryEntry[] {
  const { change, field } = changed;
  const words = LIST_WORDS[field];
  const count = items.added.length + items.removed.length;
  // another field or a change journaled before its items were
  if (!words || count === 0)
    return [{ ...entryOf(change, `${FIELD_LABELS[field][change]}${valuesOf(changed)}`), targets: null }];

  if (count > NAMED_ITEMS_MAX) {
    const label = change === 'CHANGED' ? FIELD_LABELS[field].CHANGED : `${count} ${words.count}`;
    return [{ ...entryOf(change, label), targets: { added: [...items.added], removed: [...items.removed] } }];
  }

  const named = (list: readonly ChangedItem[]) => LIST_FORMAT.format(list.map(inSentence));
  // both ways the agent sees the two gestures without the name of the field
  const both = items.added.length > 0 && items.removed.length > 0;
  const gestures: [CallForApplicationsFieldChange, readonly ChangedItem[], string][] = [
    ['ADDED', items.added, words.added],
    ['REMOVED', items.removed, words.removed],
  ];
  return gestures
    .filter(([, list]) => list.length > 0)
    .map(([gesture, list, fieldWords]) => ({
      ...entryOf(gesture, both ? named(list) : `${named(list)} ${fieldWords}`),
      targets: null,
    }));
}
