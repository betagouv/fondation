import { DocActionAgendaFiles } from './DocActionAgendaFiles';
import { DocActionAgendaMetadata } from './DocActionAgendaMetadata';
import { DocActionDelete } from './DocActionDelete';
import { DocActionOfficialReportMetadata } from './DocActionOfficialReportMetadata';
import { DocActionUpdate } from './DocActionUpdate';
import type { SessionDocument } from './session-document-groups';

export function SessionDocumentActions(props: {
  disabled: boolean;
  doc: SessionDocument;
  sessionId: string;
}) {
  const { disabled, doc, sessionId } = props;

  return (
    <div className="flex shrink-0 items-center gap-1">
      {doc.type === 'agenda' ? (
        <>
          <DocActionAgendaMetadata
            agendaId={doc.id}
            disabled={disabled}
            name={doc.name}
            sessionId={sessionId}
          />
          <DocActionAgendaFiles agendaId={doc.id} disabled={disabled} name={doc.name} sessionId={sessionId} />
        </>
      ) : (
        <DocActionOfficialReportMetadata disabled={disabled} officialReport={doc} sessionId={sessionId} />
      )}
      <DocActionUpdate disabled={disabled} doc={doc} sessionId={sessionId} />
      <DocActionDelete disabled={disabled} doc={doc} sessionId={sessionId} />
    </div>
  );
}
