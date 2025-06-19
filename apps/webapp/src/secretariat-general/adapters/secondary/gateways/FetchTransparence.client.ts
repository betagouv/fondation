import { NominationsContextTransparenceRestContract } from "shared-models";
import { FetchClient } from "../../../../shared-kernel/adapters/secondary/providers/fetchClient";
import { TransparenceClient } from "../../../core-logic/gateways/Transparence.client";

export class FetchTransparenceClient implements TransparenceClient {
  constructor(
    private readonly requestClient: FetchClient<NominationsContextTransparenceRestContract>,
  ) {}

  async transparence({
    nom,
    formation,
    year,
    month,
    day,
  }: NominationsContextTransparenceRestContract["endpoints"]["transparenceSnapshot"]["queryParams"]) {
    const transparence = await this.requestClient.fetch<"transparenceSnapshot">(
      {
        method: "GET",
        path: "snapshot/by-nom-formation-et-date",
        queryParams: {
          nom,
          formation,
          year: year,
          month: month,
          day: day,
        },
      },
    );
    return transparence;
  }
}
