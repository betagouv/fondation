import { Transparency } from "shared-models";
import { TransparencyGateway } from "../../../core-logic/gateways/Transparency.gateway";
import { TransparencyApiClient } from "../../../core-logic/gateways/TransparencyApi.client";
import { UnionToTuple } from "type-fest";

export class ApiTransparencyGateway<
  T extends string[] = UnionToTuple<Transparency>,
> implements TransparencyGateway<T>
{
  constructor(
    private readonly transparencyApiClient: TransparencyApiClient<T>,
  ) {}

  async getAttachments(transparency: T[number]) {
    const attachments =
      await this.transparencyApiClient.getAttachments(transparency);

    return attachments;
  }
}
