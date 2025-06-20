import {
  DataAdministrationContextRestContract,
  ImportNouvelleTransparenceDto,
  Magistrat,
} from "shared-models";
import { FetchClient } from "../../../../shared-kernel/adapters/secondary/providers/fetchClient";
import { DataAdministrationClient } from "../../../core-logic/gateways/DataAdministration.client";

export class ApiDataAdministrationClient implements DataAdministrationClient {
  constructor(
    private readonly requestClient: FetchClient<DataAdministrationContextRestContract>,
  ) {}

  async importNouvelleTransparenceXlsx(
    dto: ImportNouvelleTransparenceDto,
    fichier: File,
  ) {
    const formData = new FormData();
    formData.append("fichier", fichier, fichier.name);

    return this.requestClient.fetch<"importNouvelleTransparenceXlsx">({
      method: "POST",
      body: formData,
      path: "import-nouvelle-transparence-xlsx",
      queryParams: {
        nomTransparence: dto.nomTransparence,
        formation: dto.formation,
        dateTransparence: dto.dateTransparence,
        dateClotureDelaiObservation: dto.dateClotureDelaiObservation,
        dateEcheance: dto.dateEcheance,
        datePriseDePosteCible: dto.datePriseDePosteCible,
      },
    });
  }

  async importObservantsXlsx(
    dto: {
      nomTransparence: string;
      formation: Magistrat.Formation;
      dateTransparence: string;
    },
    fichier: File,
  ) {
    const formData = new FormData();
    formData.append("fichier", fichier, fichier.name);

    return this.requestClient.fetch<"importObservantsXlsx">({
      method: "POST",
      body: formData,
      path: "import-observants-xlsx",
      queryParams: {
        nomTransparence: dto.nomTransparence,
        formation: dto.formation,
        dateTransparence: dto.dateTransparence,
      },
    });
  }
}
