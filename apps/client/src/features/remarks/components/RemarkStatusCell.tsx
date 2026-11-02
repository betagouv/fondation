import { FormattedMessage, useIntl } from 'react-intl';

import {
  REMARK_STATUSES,
  type RemarkStatusEnum,
  RemarkStatusEnumMessages,
} from '@/shared/enums/remark-status.enum';
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from '@/shared/ui/menu';
import { useToasts } from '@/shared/ui/toast';
import { Tooltip } from '@/shared/ui/tooltip';
import type { PaginatedRemarkListItemDto } from '@api/types';
import { useChangeRemarkStatusMutation } from '@queries/remarks.queries';

import { RemarkStatusBadge } from './RemarkStatusBadge';
import { useRemarkStatusCommentModal } from './RemarkStatusCommentModalContext';

export function RemarkStatusCell(props: { remark: PaginatedRemarkListItemDto['items'][number] }) {
  const { formatDate, formatMessage } = useIntl();
  const toasts = useToasts();
  const changeStatus = useChangeRemarkStatusMutation();
  const { waitForStatusComment } = useRemarkStatusCommentModal();
  const { id, status } = props.remark;
  const changedOn =
    status.value !== 'NEW' && status.changedAt
      ? formatDate(status.changedAt, { format: 'zonedDateShort' })
      : null;
  const details =
    changedOn &&
    (status.comment
      ? formatMessage(
          { defaultMessage: 'Le {date} : {comment}' },
          { comment: status.comment, date: changedOn },
        )
      : formatMessage({ defaultMessage: 'Le {date}' }, { date: changedOn }));

  const change = async (next: RemarkStatusEnum) => {
    if (next === 'NEW' && status.value === 'NEW') return;

    let comment: string | null = null;
    if (next !== 'NEW') {
      const event = await waitForStatusComment(next, next === status.value ? status.comment : null);
      if (event.type === 'drop') return;
      comment = event.value;
    }

    changeStatus.mutate(
      { comment, remarkId: id, status: next },
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
                { defaultMessage: 'Statut de la remarque : {status}' },
                { status: formatMessage(RemarkStatusEnumMessages[status.value]) },
              ),
              details,
            ]
              .filter(Boolean)
              .join('. '),
          }}
          priority="tertiary no outline"
          size="small"
        >
          <RemarkStatusBadge status={status.value} />
        </MenuTrigger>
      </Tooltip>
      <MenuContent>
        {REMARK_STATUSES.map((value) => (
          <MenuItem key={value} onClick={() => void change(value)}>
            {value === status.value && value !== 'NEW' ? (
              <span className="text-[0.8125rem]">
                <FormattedMessage defaultMessage="Modifier le commentaire" />
              </span>
            ) : (
              <RemarkStatusBadge status={value} />
            )}
          </MenuItem>
        ))}
      </MenuContent>
    </MenuRoot>
  );
}
