import { frenchDate } from '../../../utils/french-date';
import { lowerFirst, requiresElision } from '../../../utils/french-words';

import {
  type AddedAndRemoved,
  type CallForApplicationsChangedField,
  type CallForApplicationsField,
  type CallForApplicationsFieldChange,
  callForApplicationsTypeOf,
  guidelinesAdaptationLabelOf,
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
  COURT_OF_APPEAL_GUIDELINES_ADAPTATION: always(
    `l'${lowerFirst(guidelinesAdaptationLabelOf('COURT_OF_APPEAL'))}`,
  ),
  DEADLINE: always('la date limite'),
  JUDICIAL_COURT_GUIDELINES_ADAPTATION: always(
    `l'${lowerFirst(guidelinesAdaptationLabelOf('JUDICIAL_COURT'))}`,
  ),
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

type HistoryEntry = {
  change: { id: CallForApplicationsFieldChange; label: string };
  label: string;
  /** the courts or the positions too many to name in the sentence */
  targets: ChangedItem[] | null;
};

export type ChangedFieldWithItems = CallForApplicationsChangedField & { items: AddedAndRemoved<ChangedItem> };

type Pending = {
  change: CallForApplicationsFieldChange;
  labels: string[];
  shared: boolean;
  targets: ChangedItem[] | null;
};

/** the changes of an update as the history reads them: each gesture on a list stands alone so that its items stay
 * with their verb and the other fields share theirs ("modifié la date limite et le commentaire") */
export function callForApplicationsHistoryChangesOf(
  fields: readonly ChangedFieldWithItems[],
): HistoryEntry[] {
  const pending: Pending[] = [];
  for (const changed of fields) {
    const words = LIST_WORDS[changed.field];
    const { added, removed } = changed.items;
    // a change journaled before its items were reads like any other field
    if (words && added.length + removed.length > 0) {
      // both ways the field goes without saying: each gesture names its items alone
      const both = added.length > 0 && removed.length > 0;
      const gestures: [CallForApplicationsFieldChange, readonly ChangedItem[], string][] = [
        ['ADDED', added, words.added],
        ['REMOVED', removed, words.removed],
      ];
      for (const [gesture, items, fieldWords] of gestures) {
        if (items.length === 0) continue;
        const counted = items.length > NAMED_ITEMS_MAX;
        const named = counted ? `${items.length} ${words.count}` : LIST_FORMAT.format(items.map(inSentence));
        pending.push({
          change: gesture,
          labels: [both ? named : `${named} ${fieldWords}`],
          shared: false,
          targets: counted ? [...items] : null,
        });
      }
      continue;
    }

    const label = `${FIELD_LABELS[changed.field][changed.change]}${valuesOf(changed)}`;
    const group = pending.find(({ change, shared }) => shared && change === changed.change);
    if (group) group.labels.push(label);
    else pending.push({ change: changed.change, labels: [label], shared: true, targets: null });
  }

  return pending.map(({ change, labels, targets }) => ({
    change: { id: change, label: FIELD_CHANGE_LABELS[change] },
    label: LIST_FORMAT.format(labels),
    targets,
  }));
}
