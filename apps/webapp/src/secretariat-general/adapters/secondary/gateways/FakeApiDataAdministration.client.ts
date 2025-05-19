import { DataAdministrationClient } from "../../../core-logic/gateways/DataAdministration.client";
import { NouvelleTransparenceDto } from "../../primary/components/NouvelleTransparence/NouvelleTransparence";

export class FakeApiDataAdministrationClient
  implements DataAdministrationClient
{
  transparences: Record<string, NouvelleTransparenceDto> = {};

  async uploadTransparence(
    transparence: NouvelleTransparenceDto,
  ): Promise<void> {
    const id = `${transparence.transparenceName}-${transparence.transparenceDate}`;
    this.transparences[id] = transparence;
  }
}
