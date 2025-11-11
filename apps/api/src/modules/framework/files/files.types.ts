import { FileType } from 'src/identity-and-access-context/business-logic/models/file-type';
import { FileMimeType } from './mime-type';
import { ReportFileUsage } from 'shared-models';

export type FondationFile = {
  path: string;
  buffer: Buffer;
  mimeType?: FileMimeType;
  meta?: {
    /** this could be a domain driven ID to store in the Db */
    id?: string;
    fileType?: FileType;
    fileUsage?: ReportFileUsage;

    [k: string]: string | undefined;
  };
};
