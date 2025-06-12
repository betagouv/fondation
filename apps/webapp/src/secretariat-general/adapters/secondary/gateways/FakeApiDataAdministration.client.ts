import { ImportNouvelleTransparenceDto } from "shared-models";
import { DataAdministrationClient } from "../../../core-logic/gateways/DataAdministration.client";

export class FakeApiDataAdministrationClient
  implements DataAdministrationClient
{
  fakeTransparences: Record<string, ImportNouvelleTransparenceDto> = {};
  importNouvelleTransparenceXlsxError?: Error;
  stubValidationError: {
    validationError?: string;
  } = {};

  async importNouvelleTransparenceXlsx(
    transparence: ImportNouvelleTransparenceDto,
  ) {
    if (this.importNouvelleTransparenceXlsxError)
      throw this.importNouvelleTransparenceXlsxError;

    const id = `${transparence.nomTransparence}-${transparence.dateTransparence}`;
    this.fakeTransparences[id] = transparence;

    return this.stubValidationError;
  }
}
