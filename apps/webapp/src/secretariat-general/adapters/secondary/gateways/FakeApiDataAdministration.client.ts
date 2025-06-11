import { ImportNouvelleTransparenceDto } from "shared-models";
import { DataAdministrationClient } from "../../../core-logic/gateways/DataAdministration.client";

export class FakeApiDataAdministrationClient
  implements DataAdministrationClient
{
  transparences: Record<string, ImportNouvelleTransparenceDto> = {};
  importNouvelleTransparenceXlsxError?: Error;

  async importNouvelleTransparenceXlsx(
    transparence: ImportNouvelleTransparenceDto,
  ): Promise<void> {
    if (this.importNouvelleTransparenceXlsxError)
      throw this.importNouvelleTransparenceXlsxError;

    const id = `${transparence.nomTransparence}-${transparence.dateTransparence}`;
    this.transparences[id] = transparence;
  }
}
