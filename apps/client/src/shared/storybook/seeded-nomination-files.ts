import { useQuery, useQueryClient } from '@tanstack/react-query';

import { sessionKeys, type SessionNominationFile } from '@queries/nomination-sessions.queries';

type SeededPages = { pageParams: number[]; pages: { items: SessionNominationFile[] }[] };

export function useSeededNominationFiles(options: {
  files: readonly SessionNominationFile[];
  sessionId: string;
}): SessionNominationFile[] {
  const queryClient = useQueryClient();
  const queryKey = sessionKeys.listSessionNominationFiles({ sessionId: options.sessionId });

  const { data } = useQuery({
    queryFn: (): SeededPages =>
      queryClient.getQueryData<SeededPages>(queryKey) ?? {
        pageParams: [0],
        pages: [{ items: [...options.files] }],
      },
    queryKey,
    staleTime: Infinity,
  });

  return data?.pages[0]?.items ?? [];
}
