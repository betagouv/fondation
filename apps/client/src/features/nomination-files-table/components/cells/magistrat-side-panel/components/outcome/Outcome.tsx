import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage } from 'react-intl';

import { useOutcomeCommentDialog } from '../../../nomination-file-outcome/OutcomeCommentModalContext';
import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import { OutcomeBadge } from '@/shared/components/outcome-badge';
import {
  useDefineNominationFileOutcomeMutation,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

import { OutcomeSelect } from './OutcomeSelect';

export function Outcome(props: { nominationFile: SessionNominationFile }) {
  const { formation } = useNominationFilesTable();
  const isSg = useIsSgNavigation();
  const { isUpdatable, outcome } = props.nominationFile.content;

  const editable = isSg && isUpdatable;

  return (
    <div className="flex flex-col gap-2">
      <label className="fr-mb-2v block text-xl font-semibold">
        <FormattedMessage defaultMessage="Issue" />
      </label>
      <div className="self-start">
        {editable ? (
          <OutcomeSelect nominationFile={props.nominationFile} />
        ) : (
          <OutcomeBadge formation={formation} outcome={outcome?.value ?? null} small={false} />
        )}
      </div>
      {isSg && outcome && (
        <OutcomeComment
          comment={outcome.comment}
          editable={editable}
          nominationFileId={props.nominationFile.id}
          outcome={outcome.value}
        />
      )}
    </div>
  );
}

function OutcomeComment(props: {
  comment: string | null;
  editable: boolean;
  nominationFileId: string;
  outcome: NonNullable<SessionNominationFile['content']['outcome']>['value'];
}) {
  const { sessionId } = useNominationFilesTable();
  const { waitForOutcomeComment } = useOutcomeCommentDialog();
  const { mutate } = useDefineNominationFileOutcomeMutation({
    nominationFileId: props.nominationFileId,
    sessionId,
  });

  const edit = async () => {
    const event = await waitForOutcomeComment(props.outcome, props.comment);
    if (event.type === 'comment') mutate({ comment: event.value, outcome: props.outcome });
  };

  if (!props.editable && !props.comment) return null;

  return (
    <div className="fr-mt-3v flex items-center gap-2">
      <i
        aria-hidden
        className="ri-message-3-line shrink-0 text-(--text-mention-grey) before:block before:size-5! before:content-['']"
      />
      <p className="fr-mb-0 min-w-0 grow text-sm wrap-break-word text-(--text-mention-grey)">
        {props.comment || <FormattedMessage defaultMessage="Aucun commentaire" />}
      </p>
      {props.editable && (
        <Button
          className="relative -top-2 btn-compact shrink-0"
          onClick={edit}
          priority="secondary"
          size="small"
        >
          {props.comment ? (
            <FormattedMessage defaultMessage="Modifier" />
          ) : (
            <FormattedMessage defaultMessage="Ajouter" />
          )}
        </Button>
      )}
    </div>
  );
}
