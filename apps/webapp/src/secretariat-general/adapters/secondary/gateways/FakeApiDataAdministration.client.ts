import { NouvelleTransparenceDto } from "shared-models";
import { ApiDataAdministrationClient } from "./ApiDataAdministration.client";

export class FakeApiDataAdministrationClient
  implements ApiDataAdministrationClient
{
  constructor(private readonly baseUrl: string) {}

  async uploadTransparency(
    nouvelleTransparenceDto: NouvelleTransparenceDto,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
