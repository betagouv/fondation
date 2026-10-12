import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { useAskForFeedback } from '@/features/feedback/hooks/useAskForFeedback';
import {
  isInvitationDue,
  readLastInvitedOn,
  rememberInvitation,
  today,
} from '@/features/feedback/utils/feedback-invitation.utils';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useUser } from '@queries/auth.queries';
import { useFeedbackQuery } from '@queries/feedback.queries';

const USE_BEFORE_INVITATION_MS = 5 * 60_000;

// asked on a page change once Fondation has been in use for a while: never on opening it, never in the middle of a page
function FeedbackInvitationOnNavigation(props: { userId: string }) {
  const askForFeedback = useAskForFeedback();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: feedback } = useFeedbackQuery();
  const [isInUse, setInUse] = useState(false);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    const timeout = setTimeout(() => setInUse(true), USE_BEFORE_INVITATION_MS);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const hasNavigated = previousPathname.current !== pathname;
    previousPathname.current = pathname;
    if (!hasNavigated || !isInUse || !feedback) return;
    // the admins test the questionnaire from the header, being asked would only get in their way
    if (feedback.status === 'PREVIEW' || feedback.status === 'TEST') return;
    if (pathname === ROUTE_PATHS.FEEDBACK) return;

    const invitedOn = today();
    const isDue = isInvitationDue({
      lastAnsweredOn: feedback.last?.answeredOn ?? null,
      lastInvitedOn: readLastInvitedOn(props.userId),
      today: invitedOn,
    });
    if (!isDue) return;

    rememberInvitation(props.userId, invitedOn);
    void askForFeedback().then((isAccepted) => {
      if (isAccepted) void navigate(ROUTE_PATHS.FEEDBACK);
    });
  }, [askForFeedback, feedback, isInUse, navigate, pathname, props.userId]);

  return null;
}

export function FeedbackInvitation() {
  const { user } = useUser();

  if (!user) return null;

  return <FeedbackInvitationOnNavigation userId={user.id} />;
}
