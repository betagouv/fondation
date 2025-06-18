import { NominationsContextTransparenceRestContract } from "shared-models";
import { TransparenceSM } from "../../../store/appState";

export interface NominationsGateway {
  transparence(
    args: NominationsContextTransparenceRestContract["endpoints"]["transparenceSnapshot"]["queryParams"],
  ): Promise<TransparenceSM>;
}
