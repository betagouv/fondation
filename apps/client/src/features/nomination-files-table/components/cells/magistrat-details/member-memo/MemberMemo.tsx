import Button from '@codegouvfr/react-dsfr/Button';

import './MemberMemo.css';

import Input from '@codegouvfr/react-dsfr/Input';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import React from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { useArchivedSession } from '@/shared/context/archived-session/useArchivedSession';
import { useUser } from '@queries/auth.queries';
import { useWriteNominationFileMemberMemoMutation } from '@queries/members.queries';

function DebouncedTextarea(props: { value: string; onChange: (value: string) => unknown }) {
  const [value, setValue] = React.useState(props.value);
  const notify = useDebouncedCallback((value: string) => props.onChange(value), 600);

  return (
    <Input
      hideLabel
      label=""
      textArea
      classes={{ nativeInputOrTextArea: 'fr-mt-2v member-memo-textarea' }}
      nativeTextAreaProps={{
        value,
        rows: 5,
        placeholder: 'Saisissez vos idées à conserver pour plus tard',
        autoFocus: true,
        onChange: ({ target }) => {
          const value = String(target.value);
          setValue(value);
          notify(value);
        },
      }}
    />
  );
}

function ReadOnlyMemo(props: { value: string | null }) {
  const value = props.value || '';

  if (value.length === 0) return <div className="text-sm text-(--text-mention-grey) italic">N/A</div>;

  // we use a <pre /> to handle '\n'
  return (
    <pre
      className="fr-mt-2v fr-mb-0 fr-px-4v fr-py-2v overflow-hidden rounded-t-lg bg-(--background-contrast-grey) leading-6 text-wrap"
      style={{ fontFamily: 'inherit' }}
    >
      {value}
    </pre>
  );
}

export function MemberMemo(props: { sessionId: string; nominationFileId: string; memo: string | null }) {
  const { isArchived } = useArchivedSession();
  const isSg = useIsSg();
  const { user } = useUser();
  const { mutate } = useWriteNominationFileMemberMemoMutation();
  const writeMemo = React.useCallback(
    (value: string) => {
      if (!user) return;

      mutate({
        userId: user.id,
        sessionId: props.sessionId,
        nominationFileId: props.nominationFileId,
        memo: value,
      });
    },
    [props, mutate, user],
  );

  const [mode, setMode] = React.useState<'read' | 'edit'>('read');
  const switchMode = React.useCallback(() => {
    setMode((m) => (m === 'edit' ? 'read' : 'edit'));
  }, [setMode]);

  if (!user || isSg) return null;

  return (
    <div className="fr-mb-4v">
      <div className="flex flex-row justify-between">
        <h3 className="fr-label fr-mb-0 flex items-center gap-x-1 text-xl">
          Commentaire
          <Tooltip
            title={
              (props.memo?.length ?? 0) > 0
                ? `Ce commentaire n'est visible que par vous`
                : `Ce commentaire ne sera visible que par vous`
            }
          />
        </h3>
        {!isArchived && (
          <Button
            size="small"
            iconId={mode === 'read' ? 'fr-icon-edit-fill' : 'ri-check-line'}
            priority="tertiary"
            onClick={switchMode}
            title={mode === 'edit' ? 'Passer en mode lecture' : 'Passer en mode édition'}
          >
            {mode === 'edit' ? 'Ok' : 'Éditer'}
          </Button>
        )}
      </div>

      <div>
        {mode === 'read' ? <ReadOnlyMemo value={props.memo} /> : null}
        {mode === 'edit' ? <DebouncedTextarea value={props.memo ?? ''} onChange={writeMemo} /> : null}
      </div>
    </div>
  );
}
