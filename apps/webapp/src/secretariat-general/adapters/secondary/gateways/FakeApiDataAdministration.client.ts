import { NouvelleTransparenceDto } from "shared-models";
import { DataAdministrationClient } from "../../../core-logic/gateways/DataAdministration.client";

export class FakeApiDataAdministrationClient
  implements DataAdministrationClient
{
  async uploadTransparency(
    nouvelleTransparenceDto: NouvelleTransparenceDto,
  ): Promise<void> {
    const formData = new FormData();
    formData.append("file", nouvelleTransparenceDto.file);
  }
}
