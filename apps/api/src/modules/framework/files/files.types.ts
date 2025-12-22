import { FileMimeType } from './mime-type';

export type FondationFile = {
  name: string;
  path: string;
  buffer: Buffer;
  mimeType?: FileMimeType;
  meta?: {
    /** this could be a domain driven ID to store in the Db */
    id?: string;

    [k: string]: string | undefined;
  };
};
