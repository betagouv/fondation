import { Transparency } from "shared-models";
import { TransparencyApiClient } from "./TransparencyApi.client";

export interface TransparencyGateway<T extends string[] = Transparency[]> {
  getAttachments(
    transparency: T[number],
  ): ReturnType<TransparencyApiClient<T>["getAttachments"]>;
}
