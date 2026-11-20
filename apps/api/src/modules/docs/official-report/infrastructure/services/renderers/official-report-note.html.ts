import type { Prisma } from '../../../../../../generated/prisma/client';
import { writerOf } from '../../../../../../utils/user.util';
import type { NamedMember } from '../../../../shared/domain/named-member';
import { parseNamedMembers } from '../../../../shared/infrastructure/named-members';
import { conjunctionList } from '../../../../shared/infrastructure/services/renderers/helpers';
import { escapeHtml } from '../../../../shared/infrastructure/services/renderers/safe-html';
import type { OfficialReportFileNote } from '../../../domain/official-report-doc-block';
import type {
  OfficialReportNoteOutdatedBy,
  OfficialReportNoteStatus,
} from '../../../domain/official-report-types';

export type OfficialReportStoredNote = {
  note: string | null;
  noteEditedAt: Date | null;
  noteEditor: { firstName: string; id: string; lastName: string } | null;
  noteOutdatedBy: OfficialReportNoteOutdatedBy | null;
  noteStatus: OfficialReportNoteStatus;
  /** `{ id, name }[]` in protocol order */
  recusedMembers: Prisma.JsonValue;
};

export function recusalMention(recusedMembers: readonly NamedMember[]): string | null {
  if (recusedMembers.length === 0) return null;

  const members = escapeHtml(conjunctionList(recusedMembers.map(({ name }) => name)));
  const verb = recusedMembers.length > 1 ? "n'ont" : "n'a";
  return `<p><em>Étant précisé que ${members} ${verb} pas délibéré ni procédé aux actes préparatoires relatifs à cette proposition de nomination.</em></p>`;
}

export function officialReportFileNote(stored: OfficialReportStoredNote): OfficialReportFileNote {
  const generatedHtml = recusalMention(parseNamedMembers(stored.recusedMembers));
  const isEdited = stored.noteStatus === 'EDITED';

  return {
    editedAt: isEdited ? (stored.noteEditedAt?.toISOString() ?? null) : null,
    editedBy: isEdited ? writerOf(stored.noteEditor) : null,
    generatedHtml,
    html: { EDITED: stored.note, GENERATED: generatedHtml, REMOVED: null }[stored.noteStatus],
    outdatedBy: stored.noteOutdatedBy,
  };
}
