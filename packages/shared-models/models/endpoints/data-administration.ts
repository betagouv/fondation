import { type DateOnlyJson } from "../date";

import { z } from 'zod';
import { Magistrat } from '../magistrat.namespace';
import { type RestContract } from './common';

export interface DataAdministrationContextRestContract extends RestContract {
  basePath: 'api/data-administration';
  endpoints: {
    importNouvelleTransparenceXlsx: {
      method: 'POST';
      path: 'import-nouvelle-transparence-xlsx';
      body: FormData;
      queryParams: ImportNouvelleTransparenceDto;
      response: {
        validationError?: string;
      };
    };
    importObservantsXlsx: {
      method: 'POST';
      path: 'import-observants-xlsx';
      body: FormData;
      queryParams: ImportObservantsXlsxDto;
      response: {
        validationError?: string;
      };
    };
    importSessionAttachment: {
      method: 'POST';
      path: 'import-session-attachment';
      body: FormData;
      queryParams: ImportSessionAttachmentDto;
      response: {
        validationError?: string;
      };
    };
    getTransparenceAttachments: {
      method: 'GET';
      path: 'transparence-attachments';
      queryParams: GetTransparencesAttachmentDto;
      response: FileDocumentSnapshot[];
    };
    getTransparenceSnapshot: {
      method: 'GET';
      path: 'transparence-snapshot';
      queryParams: GetTransparenceQueryParamsDto;
      response: TransparenceSnapshot | null;
    };
  };
}

const sessionTypeMap = {
  TRANSPARENCE: 'TRANSPARENCE',
} as const;
export type SessionType = keyof typeof sessionTypeMap;

export const importNouvelleTransparenceDtoSchema = z.object({
  nomTransparence: z.string().min(1),
  formation: z.nativeEnum(Magistrat.Formation),
  dateTransparence: z.string().date(),
  dateEcheance: z.string().date().optional(),
  datePriseDePosteCible: z.string().date().optional(),
  dateClotureDelaiObservation: z.string().date(),
});
export interface ImportNouvelleTransparenceDto
  extends z.infer<typeof importNouvelleTransparenceDtoSchema> {}

export const importObservantsXlsxDtoSchema = z.object({
  nomTransparence: z.string().min(1),
  formation: z.nativeEnum(Magistrat.Formation),
  dateTransparence: z.string().date(),
});
export interface ImportObservantsXlsxDto
  extends z.infer<typeof importObservantsXlsxDtoSchema> {}

export const importSessionAttachmentDtoSchema = z.object({
  sessionImportId: z.string().min(1),
  sessionType: z.nativeEnum(sessionTypeMap),
  dateSession: z.string().date(),
  formation: z.nativeEnum(Magistrat.Formation),
  name: z.string().min(1),
});
export interface ImportSessionAttachmentDto
  extends z.infer<typeof importSessionAttachmentDtoSchema> {}

export const getTransparenceAttachmentsDtoSchema = z.object({
  sessionImportId: z.string().min(1),
});
export interface GetTransparencesAttachmentDto
  extends z.infer<typeof getTransparenceAttachmentsDtoSchema> {}

export const fileDocumentSnapshotSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  signedUrl: z.string().min(1),
});
export interface FileDocumentSnapshot
  extends z.infer<typeof fileDocumentSnapshotSchema> { }
  

export type TransparenceSnapshot = {
  id: string;
  name: string;
  formation: Magistrat.Formation;
  dateTransparence: DateOnlyJson;
  dateEcheance: DateOnlyJson | null;
  datePriseDePosteCible: DateOnlyJson | null;
  dateClotureDelaiObservation: DateOnlyJson;
};

export interface GetTransparenceQueryParamsDto
  extends Record<string, string | number> {
  nom: string;
  formation: Magistrat.Formation;
  year: DateOnlyJson["year"];
  month: DateOnlyJson["month"];
  day: DateOnlyJson["day"];
}