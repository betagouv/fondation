import { ImportNouvelleTransparenceDto } from "shared-models";
import { DataAdministrationClient } from "../../../core-logic/gateways/DataAdministration.client";

export class FakeApiDataAdministrationClient
  implements DataAdministrationClient
{
  transparences: Record<string, ImportNouvelleTransparenceDto> = {};

  async importNouvelleTransparenceXlsx(
    transparence: ImportNouvelleTransparenceDto,
  ): Promise<void> {
    const id = `${transparence.nomTransparence}-${transparence.dateTransparence}`;
    this.transparences[id] = transparence;
  }
}
