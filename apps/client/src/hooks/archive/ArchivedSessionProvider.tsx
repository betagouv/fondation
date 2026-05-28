import { type PropsWithChildren, useState } from 'react';

import { ArchivedSessionContext } from './ArchivedSessionContext';

export function ArchivedSessionProvider({ children }: PropsWithChildren) {
  const [isArchived, setIsArchived] = useState(false);

  return <ArchivedSessionContext value={{ isArchived, setIsArchived }}>{children}</ArchivedSessionContext>;
}
