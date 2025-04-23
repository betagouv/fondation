import { Transparency } from "shared-models";
import { ApiTransparencyGateway } from "./ApiTransparency.gateway";
import { TransparencyAttachments } from "../../../core-logic/gateways/TransparencyApi.client";
import { FakeTransparencyApiClient } from "./FakeTransparency.client";

describe("Api Transparency Gateway", () => {
  let transparencyClient: FakeTransparencyApiClient;
  let apiTransparencyGateway: ApiTransparencyGateway;

  beforeEach(() => {
    transparencyClient = new FakeTransparencyApiClient();
    apiTransparencyGateway = new ApiTransparencyGateway(transparencyClient);
  });

  describe("Attachments", () => {
    it("gets attachments for a transparency", async () => {
      transparencyClient.setGdsFiles(aTransparency, aTransparencyAttachments);
      const result = await apiTransparencyGateway.getAttachments(aTransparency);
      expect(result).toEqual<TransparencyAttachments>(aTransparencyAttachments);
    });

    it("returns empty files array when no attachments exist", async () => {
      const result = await apiTransparencyGateway.getAttachments(aTransparency);
      expect(result).toEqual<TransparencyAttachments>({
        siegeEtParquet: [],
        parquet: [],
        siege: [],
      });
    });

    it("returns different attachments for different transparencies", async () => {
      transparencyClient.setGdsFiles(aTransparency, aTransparencyAttachments);
      transparencyClient.setGdsFiles(
        anotherTransparency,
        anotherTransparencyAttachments,
      );

      const result1 =
        await apiTransparencyGateway.getAttachments(aTransparency);
      const result2 =
        await apiTransparencyGateway.getAttachments(anotherTransparency);

      expect(result1).toEqual<TransparencyAttachments>(
        aTransparencyAttachments,
      );
      expect(result2).toEqual<TransparencyAttachments>(
        anotherTransparencyAttachments,
      );
    });
  });
});

const aTransparency = Transparency.AUTOMNE_2024;
const anotherTransparency = Transparency.DU_03_MARS_2025;

const aTransparencyAttachments: TransparencyAttachments = {
  siegeEtParquet: ["document-1.pdf", "document-2.pdf"],
  parquet: [],
  siege: [],
};

const anotherTransparencyAttachments: TransparencyAttachments = {
  siegeEtParquet: ["3-mars-2025.pdf"],
  parquet: [],
  siege: [],
};
