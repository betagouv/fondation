import { useMutation } from '@tanstack/react-query';
import type {
  DataAdministrationContextRestContract,
  Magistrat
} from 'shared-models';
import { TRANSPARENCES_ACCEPTED_MIME_TYPES } from '../../constants/mimetypes.constants';
import { apiFetch } from '../../utils/api-fetch.utils';
import { RealFileProvider } from '../../utils/realFileProvider';

export type ImportObservantsXlsxDto = {
  nomTransparence: string;
  formation: Magistrat.Formation;
  dateTransparence: string;
  fichier: File;
};

const importObservants = async (
  importObservantsDto: ImportObservantsXlsxDto
) => {
  const {
    method
  }: Partial<
    DataAdministrationContextRestContract['endpoints']['importObservantsXlsx']
  > = {
    method: 'POST',
    path: 'import-observants-xlsx'
  };

  await new RealFileProvider().assertMimeTypeFactory(
    TRANSPARENCES_ACCEPTED_MIME_TYPES
  )(importObservantsDto.fichier);

  const { nomTransparence, formation, dateTransparence } = importObservantsDto;

  const queries = new URLSearchParams({
    nomTransparence,
    formation,
    dateTransparence
  });

  return await apiFetch(
    `/nominations/transparence/import-observants?${queries}`,
    {
      method,
      body: importObservantsDto.fichier
    }
  );
};

export const useImportObservants = () => {
  return useMutation({
    mutationFn: importObservants
  });
};
