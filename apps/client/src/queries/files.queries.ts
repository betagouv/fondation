import { useMutation } from '@tanstack/react-query';

import { fileNameFromResponse, saveBlob } from '@/utils/file.utils';
import * as $api from '@api/sdk';

function fileUrlIdFrom(publicUrl: string): string {
  return new URL(publicUrl).pathname.split('/').at(-1) ?? '';
}

export const useDownloadFileMutation = () =>
  useMutation({
    mutationFn: async (command: { name: string; url: string }): Promise<void> => {
      const { data, response } = await $api.files.getFileByFileUrl({
        parseAs: 'blob',
        path: { fileUrlId: fileUrlIdFrom(command.url) },
        query: { download: '' },
      });

      saveBlob(data as Blob, fileNameFromResponse(response, command.name));
    },
  });
