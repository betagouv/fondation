import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { useIntl } from 'react-intl';
import { generatePath, Link } from 'react-router';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { isPreviewSeen } from '@/features/feedback/utils/preview-seen.utils';
import { Tooltip } from '@/shared/ui/tooltip';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useSessionFeedbackQuery } from '@queries/feedback.queries';

export function SessionFeedbackButton(props: { sessionId: string }) {
  const { formatMessage } = useIntl();
  const isSg = useIsSgNavigation();
  const { data: feedback } = useSessionFeedbackQuery(props);

  if (!feedback || feedback.status === 'ANSWERED') return null;

  const label =
    feedback.status === 'PREVIEW'
      ? formatMessage({ defaultMessage: 'Voir le questionnaire de cette session' })
      : formatMessage({ defaultMessage: 'Donner mon avis sur cette session' });
  return (
    <Tooltip className="pointer-events-auto" label={label}>
      <span className="relative inline-flex">
        <Link
          aria-label={label}
          className={clsx(
            cx('fr-btn', 'fr-icon-feedback-line'),
            'size-10! justify-center! px-0! shadow-[0_4px_12px_rgba(0,0,0,0.08)] before:m-0! before:[--icon-size:1rem]!',
          )}
          to={generatePath(
            isSg ? ROUTE_PATHS.SG.SESSION_ID_FEEDBACK : ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS_FEEDBACK,
            { sessionId: props.sessionId },
          )}
        />
        {(feedback.status === 'NOT_ANSWERED' || !isPreviewSeen(props.sessionId)) && (
          <span
            aria-hidden
            className="pointer-events-none absolute -top-1 -right-1 size-3 rounded-full border-2 border-solid border-(--background-default-grey) bg-(--background-flat-error)"
          />
        )}
      </span>
    </Tooltip>
  );
}

// TODO: see SessionCommentPanel
export function SessionFeedbackFloatingButton(props: { sessionId: string }) {
  return (
    <div
      className="fixed right-[calc(var(--fondation-side-panel-width)+1.5rem)] bottom-6 z-(--z-index-panel) transition-[right] duration-300 ease-out motion-reduce:transition-none"
      data-side-panel-companion
    >
      <SessionFeedbackButton sessionId={props.sessionId} />
    </div>
  );
}
