import { TransparencyGateway } from "../../../core-logic/gateways/Transparency.gateway";
import { TransparencyApiClient } from "../../../core-logic/gateways/TransparencyApi.client";

export class ApiTransparencyGateway implements TransparencyGateway {
  constructor(private readonly transparencyApiClient: TransparencyApiClient) {}

  async getAttachments(transparency: string) {
    const attachments =
      await this.transparencyApiClient.getAttachments(transparency);

    return attachments;
  }
}
