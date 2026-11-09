import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { useAskForSurvey } from '@/features/survey/hooks/useAskForSurvey';
import {
  isInvitationDue,
  readLastInvitedOn,
  rememberInvitation,
  today,
} from '@/features/survey/utils/survey-invitation.utils';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useUser } from '@queries/auth.queries';
import { useSurveyQuery } from '@queries/survey.queries';

const USE_BEFORE_INVITATION_MS = 5 * 60_000;

// asked on a page change once Fondation has been in use for a while: never on opening it, never in the middle of a page
function SurveyInvitationOnNavigation(props: { userId: string }) {
  const askForSurvey = useAskForSurvey();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: survey } = useSurveyQuery();
  const [isInUse, setInUse] = useState(false);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    const timeout = setTimeout(() => setInUse(true), USE_BEFORE_INVITATION_MS);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const hasNavigated = previousPathname.current !== pathname;
    previousPathname.current = pathname;
    if (!hasNavigated || !isInUse || !survey) return;
    // the admins test the questionnaire from the header, being asked would only get in their way
    if (survey.status === 'PREVIEW' || survey.status === 'TEST') return;
    if (pathname === ROUTE_PATHS.SURVEY) return;

    const invitedOn = today();
    const isDue = isInvitationDue({
      lastAnsweredOn: survey.last?.answeredOn ?? null,
      lastInvitedOn: readLastInvitedOn(props.userId),
      today: invitedOn,
    });
    if (!isDue) return;

    rememberInvitation(props.userId, invitedOn);
    void askForSurvey().then((isAccepted) => {
      if (isAccepted) void navigate(ROUTE_PATHS.SURVEY);
    });
  }, [askForSurvey, survey, isInUse, navigate, pathname, props.userId]);

  return null;
}

export function SurveyInvitation() {
  const { user } = useUser();

  if (!user) return null;

  return <SurveyInvitationOnNavigation userId={user.id} />;
}
