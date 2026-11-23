import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { withValidationError } from '@/utils/validation-error';
import * as $api from '@api/sdk';
import type { CreateApiClientDto } from '@api/types';

const apiClientKeys = {
  listApiClients: () => ['apiClients', 'listApiClients'] as const,
};

export const useApiClientsQuery = () =>
  useQuery({
    queryFn: () => $api.apiClients.listApiClients({ throwOnError: true }).then(({ data }) => data),
    queryKey: apiClientKeys.listApiClients(),
  });

function useInvalidatingMutation<TVariables, TData>(mutationFn: (variables: TVariables) => Promise<TData>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: apiClientKeys.listApiClients() }),
  });
}

export const useCreateApiClientMutation = () =>
  useInvalidatingMutation((body: CreateApiClientDto) =>
    withValidationError(() => $api.apiClients.createApiClient({ body, throwOnError: true })).then(
      ({ data }) => data,
    ),
  );

export const useRotateApiClientSecretMutation = () =>
  useInvalidatingMutation((props: { clientId: string; days: number }) =>
    withValidationError(() =>
      $api.apiClients.rotateApiClientSecret({
        body: { days: props.days },
        path: { clientId: props.clientId },
        throwOnError: true,
      }),
    ).then(({ data }) => data),
  );

export const useEndApiClientSecretRotationMutation = () =>
  useInvalidatingMutation((clientId: string) =>
    $api.apiClients.endApiClientSecretRotation({ path: { clientId }, throwOnError: true }),
  );

export const useRevokeApiClientMutation = () =>
  useInvalidatingMutation((clientId: string) =>
    $api.apiClients.revokeApiClient({ path: { clientId }, throwOnError: true }),
  );
