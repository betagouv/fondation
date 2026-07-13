import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage } from 'react-intl';

import { NominationFileOutcomeBadge } from '../../../nomination-file-outcome/NominationFileOutcomeBadge';
import { useOutcomeCommentDialog } from '../../../nomination-file-outcome/OutcomeCommentModalContext';
import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import {
  useDefineNominationFileOutcomeMutation,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

import { MagistratOutcomeSelect } from './MagistratOutcomeSelect';

export function MagistratOutcome(props: { nominationFile: SessionNominationFile }) {
  const { formation } = useNominationFilesTable();
  const isSg = useIsSgNavigation();
  const { outcome } = props.nominationFile.content;

  return (
    <div className="flex flex-col gap-2">
      <label className="fr-mb-2v block text-xl font-semibold">
        <FormattedMessage defaultMessage="Issue" />
      </label>
      <div className="self-start">
        {isSg ? (
          <MagistratOutcomeSelect nominationFile={props.nominationFile} />
        ) : (
          <NominationFileOutcomeBadge formation={formation} outcome={outcome?.value ?? null} small={false} />
        )}
      </div>
      {isSg && outcome && (
        <MagistratOutcomeComment
          comment={outcome.comment}
          nominationFileId={props.nominationFile.id}
          outcome={outcome.value}
        />
      )}
    </div>
  );
}

function MagistratOutcomeComment(props: {
  comment: string | null;
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

  return (
    <div className="fr-mt-3v flex items-center gap-2">
      <i
        aria-hidden
        className="ri-message-3-line shrink-0 text-(--text-mention-grey) before:block before:size-5! before:content-['']"
      />
      <p className="fr-mb-0 min-w-0 grow text-sm wrap-break-word text-(--text-mention-grey)">
        {props.comment || <FormattedMessage defaultMessage="Aucun commentaire" />}
      </p>
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
    </div>
  );
}
