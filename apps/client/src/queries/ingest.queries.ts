import { useMutation } from '@tanstack/react-query';

import * as $api from '@api/sdk';

export const useIngestLolfiArchiveMutation = () =>
  useMutation({
    mutationFn: (mutation: { archive: File }) =>
      $api.ingest.ingestLolfiArchive({ body: { file: mutation.archive } }).then(({ data }) => data ?? null),
  });
