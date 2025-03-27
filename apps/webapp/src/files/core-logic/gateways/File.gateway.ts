import { FileVM } from "shared-models";

export interface FileGateway {
  getSignedUrls(ids: string[]): Promise<FileVM[]>;
}
