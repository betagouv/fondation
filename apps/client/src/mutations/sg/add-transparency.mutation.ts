import { useMutation } from '@tanstack/react-query';
import type { DataAdministrationContextRestContract, Magistrat } from 'shared-models';
import { TRANSPARENCES_ACCEPTED_MIME_TYPES } from '../../constants/mimetypes.constants';
import { apiFetch } from '../../utils/api-fetch.utils';
import { RealFileProvider } from '../../utils/realFileProvider';

export type ImportTransparenceXlsxDto = {
  nomTransparence: string;
  formation: Magistrat.Formation;
  dateTransparence: string;
  dateEcheance: string | null;
  datePriseDePosteCible: string | null;
  dateClotureDelaiObservation: string;
  fichier: File;
};

const addTransparency = async (dto: ImportTransparenceXlsxDto) => {
  const {
    fichier,
    nomTransparence,
    formation,
    dateTransparence,
    dateEcheance,
    datePriseDePosteCible,
    dateClotureDelaiObservation
  } = dto;
  await new RealFileProvider().assertMimeTypeFactory(TRANSPARENCES_ACCEPTED_MIME_TYPES)(dto.fichier);

  const {
    method
  }: Partial<DataAdministrationContextRestContract['endpoints']['importNouvelleTransparenceXlsx']> = {
    method: 'POST'
  };

  const formData = new FormData();
  formData.append('fichier', fichier, fichier.name);

  const queryParams = new URLSearchParams({
    nomTransparence,
    formation,
    dateTransparence,
    dateClotureDelaiObservation
  });

  if (dateEcheance) {
    queryParams.set('dateEcheance', dateEcheance);
  }
  if (datePriseDePosteCible) {
    queryParams.set('datePriseDePosteCible', datePriseDePosteCible);
  }

  return apiFetch(`/data-administration/import-nouvelle-transparence-xlsx?${queryParams}`, {
    method,
    body: formData
  });
};

export const useAddTransparency = () => {
  return useMutation({
    mutationFn: addTransparency
  });
};
