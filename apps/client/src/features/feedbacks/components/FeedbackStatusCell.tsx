import { FormattedMessage, useIntl } from 'react-intl';

import {
  FEEDBACK_STATUSES,
  type FeedbackStatusEnum,
  FeedbackStatusEnumMessages,
} from '@/shared/enums/feedback-status.enum';
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from '@/shared/ui/menu';
import { useToasts } from '@/shared/ui/toast';
import { Tooltip } from '@/shared/ui/tooltip';
import type { ListedFeedbacksDto } from '@api/types';
import { useChangeFeedbackStatusMutation } from '@queries/feedbacks.queries';

import { FeedbackStatusBadge } from './FeedbackStatusBadge';
import { useFeedbackStatusCommentModal } from './FeedbackStatusCommentModalContext';

export function FeedbackStatusCell(props: { feedback: ListedFeedbacksDto['items'][number] }) {
  const { formatDate, formatMessage } = useIntl();
  const toasts = useToasts();
  const changeStatus = useChangeFeedbackStatusMutation();
  const { waitForStatusComment } = useFeedbackStatusCommentModal();
  const { id, status } = props.feedback;
  const changedOn =
    status.value !== 'NEW' && status.changedAt
      ? formatDate(status.changedAt, { format: 'zonedDateShort' })
      : null;
  const changed =
    changedOn &&
    (status.changedBy
      ? formatMessage(
          { defaultMessage: 'Le {date} par {name}' },
          { date: changedOn, name: status.changedBy.name },
        )
      : formatMessage({ defaultMessage: 'Le {date}' }, { date: changedOn }));
  const details =
    changed && status.comment
      ? formatMessage({ defaultMessage: '{changed} : {comment}' }, { changed, comment: status.comment })
      : changed;

  const change = async (next: FeedbackStatusEnum) => {
    let comment: string | null = null;
    if (next !== 'NEW') {
      const event = await waitForStatusComment(next, status.comment);
      if (event.type === 'drop') return;
      comment = event.value;
    }

    changeStatus.mutate(
      { comment, feedbackId: id, status: next },
      {
        onError: () =>
          toasts.error({ title: formatMessage({ defaultMessage: "Le statut n'a pas pu être changé" }) }),
      },
    );
  };

  return (
    <MenuRoot>
      <Tooltip label={details}>
        <MenuTrigger
          className="min-h-0! p-0! after:transition-transform data-popup-open:after:rotate-180"
          disabled={changeStatus.isPending}
          iconId="fr-icon-arrow-down-s-line"
          iconPosition="right"
          nativeButtonProps={{
            'aria-label': [
              formatMessage(
                { defaultMessage: 'Statut du retour : {status}' },
                { status: formatMessage(FeedbackStatusEnumMessages[status.value]) },
              ),
              details,
            ]
              .filter(Boolean)
              .join('. '),
          }}
          priority="tertiary no outline"
          size="small"
        >
          <FeedbackStatusBadge status={status.value} />
          {status.comment && (
            <span
              aria-hidden
              className="fr-icon-chat-3-line fr-icon--sm fr-ml-1v [&::before]:[--icon-size:0.875rem]"
            />
          )}
        </MenuTrigger>
      </Tooltip>
      <MenuContent>
        {FEEDBACK_STATUSES.map((value) => (
          <MenuItem
            disabled={value === 'NEW' && status.value === 'NEW'}
            key={value}
            onClick={() => void change(value)}
          >
            <FeedbackStatusBadge status={value} />
            {value === status.value && (
              <>
                <span aria-hidden className="fr-icon-check-line fr-icon--sm fr-ml-2v" />
                <span className="fr-sr-only">
                  {value === 'NEW' ? (
                    <FormattedMessage defaultMessage="statut actuel" />
                  ) : (
                    <FormattedMessage defaultMessage="statut actuel, modifier le commentaire" />
                  )}
                </span>
              </>
            )}
          </MenuItem>
        ))}
      </MenuContent>
    </MenuRoot>
  );
}
