import { TransparencyApiClient } from "./TransparencyApi.client";

export interface TransparencyGateway {
  getAttachments(
    transparency: string,
  ): ReturnType<TransparencyApiClient["getAttachments"]>;
}
