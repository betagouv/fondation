import { useEffect, type PropsWithChildren } from 'react';

import { useSessionValidation } from '@/shared/context/session-validation';

export function SessionValidationBannerPortal(
  props: PropsWithChildren<{ session: { id: string; isValidated: boolean } | null | undefined }>,
) {
  const sessionId = props.session?.id;
  const isValidated = props.session?.isValidated;
  const { setSessionToValidate } = useSessionValidation();

  useEffect(() => {
    setSessionToValidate(sessionId && !isValidated ? { id: sessionId } : null);
    return () => {
      setSessionToValidate(null);
    };
  }, [isValidated, sessionId, setSessionToValidate]);

  return props.children;
}
