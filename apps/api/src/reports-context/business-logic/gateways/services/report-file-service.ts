import { Readable } from 'stream';

export interface ReportFileService {
  uploadFile(name: string, stream: Readable): Promise<string>;
}
