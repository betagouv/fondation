import { useEffect } from 'react';

import { useArchivedSession } from '@/shared/context/archived-session/useArchivedSession';

export function ArchiveBannerPortal(
  props: React.PropsWithChildren<{ isArchived: boolean | undefined | null }>,
) {
  const { isArchived } = props;
  const { setIsArchived } = useArchivedSession();

  useEffect(() => {
    setIsArchived(Boolean(isArchived));
    return () => {
      setIsArchived(false);
    };
  }, [isArchived, setIsArchived]);

  return props.children;
}
