import { NominationsContextTransparenceRestContract } from "shared-models";
import { TransparenceClient } from "../../../core-logic/gateways/Transparence.client";

export class FakeTransparenceClient implements TransparenceClient {
  fakeTransparences: Record<
    string,
    NominationsContextTransparenceRestContract["endpoints"]["transparenceSnapshot"]["response"]
  > = {};

  stubError?: Error;

  async transparence({
    nom,
    formation,
    year,
    month,
    day,
  }: NominationsContextTransparenceRestContract["endpoints"]["transparenceSnapshot"]["queryParams"]) {
    if (this.stubError) {
      throw this.stubError;
    }

    const key = `${nom}-${formation}-${year}-${month}-${day}`;
    const transparence = this.fakeTransparences[key];

    if (!transparence) {
      throw new Error(`Transparence not found with key: ${key}`);
    }

    return transparence;
  }
}
