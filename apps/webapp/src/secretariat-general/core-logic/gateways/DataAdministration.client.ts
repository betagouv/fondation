import {
  DataAdministrationContextRestContract,
  ImportNouvelleTransparenceDto,
  ImportObservantsXlsxDto,
} from "shared-models";

export type EndpointResponse<
  T extends keyof DataAdministrationContextRestContract["endpoints"],
> = Promise<DataAdministrationContextRestContract["endpoints"][T]["response"]>;

export interface DataAdministrationClient {
  importNouvelleTransparenceXlsx(
    dto: ImportNouvelleTransparenceDto,
    fichier: File,
  ): EndpointResponse<"importNouvelleTransparenceXlsx">;

  importObservantsXlsx(
    dto: ImportObservantsXlsxDto,
    fichier: File,
  ): EndpointResponse<"importObservantsXlsx">;
}
