import { FileGateway } from "../../../core-logic/gateways/File.gateway";
import { FileApiClient } from "../../../core-logic/gateways/File.client";

export class ApiFileGateway implements FileGateway {
  constructor(private readonly fileApiClient: FileApiClient) {}

  async getSignedUrls(ids: string[]) {
    return this.fileApiClient.getSignedUrls(ids);
  }
}
