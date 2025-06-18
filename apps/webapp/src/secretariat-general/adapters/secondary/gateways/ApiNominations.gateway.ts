import { NominationsContextTransparenceRestContract } from "shared-models";
import { TransparenceClient } from "../../../core-logic/gateways/Transparence.client";
import { NominationsGateway } from "../../../core-logic/gateways/Nominations.gateway";
import { TransparenceSM } from "../../../../store/appState";

export class ApiNominationsGateway implements NominationsGateway {
  constructor(private readonly transparenceClient: TransparenceClient) {}

  async transparence(
    args: NominationsContextTransparenceRestContract["endpoints"]["transparenceSnapshot"]["queryParams"],
  ): Promise<TransparenceSM> {
    const transpa = await this.transparenceClient.transparence(args);

    return {
      id: transpa.id,
      nom: transpa.name,
      formation: transpa.formation,
      dateTransparence: transpa.content.dateTransparence,
      dateClotureDelaiObservation: transpa.content.dateClôtureDélaiObservation,
    };
  }
}
