import * as $api from '@api/sdk';
import { useMutation } from '@tanstack/react-query';

export const useIngestLolfiArchiveMutation = () =>
  useMutation({
    mutationFn: (mutation: { archive: File }) =>
      $api.ingest.ingestLolfiArchive({ body: { file: mutation.archive } }).then(({ data }) => data ?? null)
  });
