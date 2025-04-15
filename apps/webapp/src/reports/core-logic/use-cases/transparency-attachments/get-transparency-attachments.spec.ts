import { Role } from "shared-models";
import { AuthenticatedUserSM } from "../../../../authentication/core-logic/gateways/Authentication.gateway";
import {
  authenticate,
  AuthenticateParams,
} from "../../../../authentication/core-logic/use-cases/authentication/authenticate";
import { ApiFileGateway } from "../../../../files/adapters/secondary/gateways/ApiFile.gateway";
import { FakeFileApiClient } from "../../../../files/adapters/secondary/gateways/FakeFile.client";
import { AppState } from "../../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { ApiTransparencyGateway } from "../../../adapters/secondary/gateways/ApiTransparency.gateway";
import { FakeTransparencyApiClient } from "../../../adapters/secondary/gateways/FakeTransparency.client";
import { TransparencyAttachments } from "../../gateways/TransparencyApi.client";
import { getTransparencyAttachmentsFactory } from "./get-transparency-attachments";

const transparency = "transpa-test";

describe("Get Transparency Attachments", () => {
  let store: ReduxStore<true, ["transpa-test"]>;
  let initialState: AppState<true, ["transpa-test"]>;
  let transparencyClient: FakeTransparencyApiClient<["transpa-test"]>;
  let fileApiClient: FakeFileApiClient;

  beforeEach(() => {
    transparencyClient = new FakeTransparencyApiClient();
    const transparencyGateway = new ApiTransparencyGateway<["transpa-test"]>(
      transparencyClient,
    );

    fileApiClient = new FakeFileApiClient();
    const fileGateway = new ApiFileGateway(fileApiClient);

    store = initReduxStore<true, ["transpa-test"]>(
      {
        transparencyGateway,
        fileGateway,
      },
      {},
      {},
      {},
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      ["transpa-test"],
    );
  });

  describe("Given some GDS transparency attachments", () => {
    beforeEach(() => {
      const attachments: TransparencyAttachments = {
        siegeEtParquet: ["file-id-1"],
        parquet: ["file-id-parquet"],
      };
      transparencyClient.setGdsFiles("transpa-test", attachments);

      fileApiClient.addFiles([
        {
          fileId: "file-id-1",
          name: "file-id-1-name",
          signedUrl: "https://example.com/signed-url/file-id-1-name",
        },
        {
          fileId: "file-id-parquet",
          name: "file-id-parquet-name",
          signedUrl: "https://example.com/signed-url/file-id-parquet-name",
        },
      ]);
    });

    describe("Membre du parquet", () => {
      beforeEach(() => {
        givenAMembreDuSiege();
        initialState = store.getState();
      });

      it("gets attachments for a specific transparency", async () => {
        await getTransparencyAttchments();
        expectGdsStoredFiles("file-id-1-name");
      });
    });

    describe("Membre commun", () => {
      beforeEach(() => {
        givenAMembreCommun();
        initialState = store.getState();
      });

      it("gets attachments for a specific transparency", async () => {
        await getTransparencyAttchments();
        expectGdsStoredFiles("file-id-1-name", "file-id-parquet-name");
      });
    });
  });

  const givenAMembreCommun = () => givenAUser(Role.MEMBRE_COMMUN);
  const givenAMembreDuSiege = () => givenAUser(Role.MEMBRE_DU_SIEGE);

  const givenAUser = (role: Role) => {
    const user: AuthenticatedUserSM = {
      firstName: "User",
      lastName: "Current",
      role,
    };
    store.dispatch(authenticate.fulfilled(user, "", userCredentials));
  };

  const getTransparencyAttchments = () =>
    store.dispatch(
      getTransparencyAttachmentsFactory<["transpa-test"]>()({
        transparency,
      }),
    );

  const expectGdsStoredFiles = (...fileNames: string[]) =>
    expect(store.getState()).toEqual<AppState<true, ["transpa-test"]>>({
      ...initialState,
      transparencies: {
        GDS: {
          [transparency]: {
            files: fileNames.map((fileName) => ({
              name: fileName,
              signedUrl: `https://example.com/signed-url/${fileName}`,
            })),
          },
        },
      },
    });
});

const userCredentials: AuthenticateParams = {
  email: "user@example.fr",
  password: "password",
};
