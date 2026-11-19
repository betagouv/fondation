import { useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CommentLastChange } from '@/shared/components/comment-last-change';
import { CommentEditor } from '@/shared/ui/comment-editor';
import { HttpException } from '@/utils/http-exception';
import {
  type CommentedPosition,
  usePositionCommentQuery,
  useWritePositionCommentMutation,
} from '@queries/veille-des-postes.queries';

import { RetryableLoadFailure } from './RetryableLoadFailure';

/** the comment of a watched position: saved with "Valider" like the comment of the secretariat */
export function PositionCommentSection(props: {
  onDirtyChange: (isDirty: boolean) => void;
  position: CommentedPosition;
}) {
  const { formatMessage } = useIntl();
  const { data, error, isFetching, refetch } = usePositionCommentQuery(props.position);
  const write = useWritePositionCommentMutation();

  // the side panel already says that the magistrat no longer holds the position or that the court left the veille
  const isGone = error instanceof HttpException && error.statusCode === 404;

  const [isDirty, setIsDirty] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const warnsUnsaved = isDirty && !isFocused && !write.isPending;

  // a click on "Valider" takes the focus away from the field before it saves. Safari gives it to nothing
  const isPressing = useRef(false);

  const { onDirtyChange } = props;

  useEffect(() => {
    onDirtyChange(isDirty && !isGone);

    return () => onDirtyChange(false);
  }, [isDirty, isGone, onDirtyChange]);

  // the editor reads its text once: it starts over on the trimmed version of the API after each save. It also
  // takes another agent's version unless a change is being typed
  const savedVersion = data?.lastChange?.at ?? 'none';
  const [editorVersion, setEditorVersion] = useState(savedVersion);
  const [saves, setSaves] = useState(0);

  if (!isDirty && savedVersion !== editorVersion) setEditorVersion(savedVersion);

  if (isGone) return null;

  return (
    <section className="flex flex-col gap-4 border-t border-(--border-default-grey) pt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="fr-mb-0 text-lg font-semibold text-(--text-label-grey)">
          <FormattedMessage defaultMessage="Commentaire" />
        </h3>
        {data?.lastChange && <CommentLastChange {...data.lastChange} />}
      </div>
      {!data && error && (
        <RetryableLoadFailure
          isRetrying={isFetching}
          onRetry={() => void refetch()}
          title={<FormattedMessage defaultMessage="Le commentaire n'a pas pu être chargé" />}
        />
      )}
      {data && (
        <div
          onBlur={(event) => {
            if (!isPressing.current && !event.currentTarget.contains(event.relatedTarget))
              setIsFocused(false);
          }}
          onFocus={() => setIsFocused(true)}
          onPointerDown={() => {
            isPressing.current = true;
            // released anywhere even outside the block
            window.addEventListener('pointerup', () => (isPressing.current = false), { once: true });
          }}
        >
          <CommentEditor
            ariaLabel={formatMessage({ defaultMessage: 'Commentaire' })}
            emptyLabel={<FormattedMessage defaultMessage="Aucun commentaire" />}
            initialValue={data.comment}
            key={`${editorVersion} ${saves}`}
            maxLength={data.maxLength}
            onDirtyChange={setIsDirty}
            onSave={async (comment) => {
              await write.mutateAsync({ comment: comment ?? '', position: props.position });
              setSaves((count) => count + 1);
            }}
            placeholder={formatMessage({ defaultMessage: 'Saisissez un commentaire…' })}
            warning={warnsUnsaved}
          />
        </div>
      )}
    </section>
  );
}
