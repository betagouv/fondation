import { useQuery } from '@tanstack/react-query';
import { Magistrat, type FilesContextRestContract } from 'shared-models';
import { z } from 'zod';
import { apiFetch } from '../utils/api-fetch.utils';

export const transparencyAttachmentsSchema = z.object({
  siegeEtParquet: z.string().array(),
  parquet: z.string().array(),
  siege: z.string().array()
});

const transparenciesAttachmentsSchema = z.record(z.string(), transparencyAttachmentsSchema);

export type TransparencyAttachments = z.infer<typeof transparencyAttachmentsSchema>;

const filterAttachments = (formation: Magistrat.Formation, files: TransparencyAttachments) => {
  switch (formation) {
    case Magistrat.Formation.PARQUET:
      // TODO VALIDATE THIS PART WITH REMY AND ALICE
      // if ([Role.MEMBRE_COMMUN, Role.MEMBRE_DU_PARQUET].includes(role))
      return [...files.siegeEtParquet, ...files.parquet];
    // break;
    case Magistrat.Formation.SIEGE:
      // if ([Role.MEMBRE_COMMUN, Role.MEMBRE_DU_SIEGE].includes(role))
      return [...files.siegeEtParquet, ...files.siege];
    // break;
    default: {
      const _exhaustiveCheck: never = formation;
      console.info(_exhaustiveCheck);
      throw new Error(`Formation ${formation} not handled in filterAttachments function`);
    }
  }
};

const attachmentsApiFetch = async (transparency: string, formation: Magistrat.Formation) => {
  const transparenciesFileIdsSerialized = import.meta.env.VITE_GDS_TRANSPA_FILES_IDS!;

  const transparenciesFileIds = transparenciesAttachmentsSchema.parse(
    JSON.parse(transparenciesFileIdsSerialized)
  );

  const attachementsIds = transparenciesFileIds[transparency] ?? {
    siegeEtParquet: [],
    parquet: [],
    siege: []
  };

  const filteredAttachments = filterAttachments(
    // user.role,
    formation,
    attachementsIds
  );

  const { method, path }: Partial<FilesContextRestContract['endpoints']['getSignedUrls']> = {
    method: 'GET',
    path: 'signed-urls'
  };

  return apiFetch(`/files/${path}?${new URLSearchParams({ ids: filteredAttachments.join(',') })}`, {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

export const TRANSPARENCY_ATTACHMENTS_QUERY_KEY = 'transparencies-attachments';
export const useGetTransparenciesAttachments = (transparency: string, formation: Magistrat.Formation) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [TRANSPARENCY_ATTACHMENTS_QUERY_KEY, transparency, formation],
    queryFn: () => attachmentsApiFetch(transparency, formation),
    retry: false,
    staleTime: 0,
    gcTime: 0
  });

  return {
    data,
    isLoading,
    isError
  };
};
