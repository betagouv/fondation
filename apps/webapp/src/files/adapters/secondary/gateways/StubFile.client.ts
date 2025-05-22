import { FileVM } from "shared-models";
import { FileApiClient } from "../../../core-logic/gateways/File.client";

export class StubFileApiClient implements FileApiClient {
  signedUrlsVM: FileVM[] = [];

  async getSignedUrls(): Promise<FileVM[]> {
    return this.signedUrlsVM;
  }
}
