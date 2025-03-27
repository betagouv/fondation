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
      transparencyClient.addGdsFiles(aTransparency, aTransparencyAttachments);
      const result = await apiTransparencyGateway.getAttachments(aTransparency);
      expect(result).toEqual<TransparencyAttachments>(aTransparencyAttachments);
    });

    it("returns empty files array when no attachments exist", async () => {
      const result = await apiTransparencyGateway.getAttachments(aTransparency);
      expect(result).toEqual<TransparencyAttachments>({ files: [] });
    });

    it("returns different attachments for different transparencies", async () => {
      transparencyClient.addGdsFiles(aTransparency, aTransparencyAttachments);
      transparencyClient.addGdsFiles(
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
  files: [
    {
      fileId: "document1.pdf",
      metaPreSignedUrl: `https://example.fr/transparency/${aTransparency}/document1.pdf`,
    },
    {
      fileId: "document2.pdf",
      metaPreSignedUrl: `https://example.fr/transparency/${aTransparency}/document2.pdf`,
    },
  ],
};

const anotherTransparencyAttachments: TransparencyAttachments = {
  files: [
    {
      fileId: "3-mars-2025.pdf",
      metaPreSignedUrl: `https://example.fr/transparency/${anotherTransparency}/3-mars-2025.pdf`,
    },
  ],
};
