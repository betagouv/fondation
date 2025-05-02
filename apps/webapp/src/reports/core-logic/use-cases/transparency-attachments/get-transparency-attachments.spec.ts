import { Gender, Magistrat, Role } from "shared-models";
import { AuthenticatedUserSM } from "../../../../authentication/core-logic/gateways/Authentication.gateway";
import {
  authenticate,
  AuthenticateParams,
} from "../../../../authentication/core-logic/use-cases/authentication/authenticate";
import { ApiFileGateway } from "../../../../files/adapters/secondary/gateways/ApiFile.gateway";
import { FakeFileApiClient } from "../../../../files/adapters/secondary/gateways/FakeFile.client";
import { AppState } from "../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
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
        siegeEtParquet: ["file-id-commun"],
        parquet: ["file-id-parquet"],
        siege: ["file-id-siège"],
      };
      transparencyClient.setGdsFiles("transpa-test", attachments);

      fileApiClient.addFiles([
        {
          fileId: "file-id-commun",
          name: "file-name-commun",
          signedUrl: "https://example.com/signed-url/file-name-commun",
        },
        {
          fileId: "file-id-parquet",
          name: "file-name-parquet",
          signedUrl: "https://example.com/signed-url/file-name-parquet",
        },
        {
          fileId: "file-id-siège",
          name: "file-name-siège",
          signedUrl: "https://example.com/signed-url/file-name-siège",
        },
      ]);
    });

    describe.each([
      {
        testName: "Membre du siège",
        givenAUser: givenAMembreDuSiege,
        formation: Magistrat.Formation.SIEGE,
        expectedFiles: ["file-name-commun", "file-name-siège"],
      },
      {
        testName: "Membre du parquet",
        givenAUser: givenAMembreDuParquet,
        formation: Magistrat.Formation.PARQUET,
        expectedFiles: ["file-name-commun", "file-name-parquet"],
      },
      {
        testName: "Membre commun",
        givenAUser: givenAMembreCommun,
        formation: Magistrat.Formation.PARQUET,
        expectedFiles: ["file-name-commun", "file-name-parquet"],
      },
    ])("$testName", ({ givenAUser, expectedFiles, formation }) => {
      beforeEach(() => {
        givenAUser();
        initialState = store.getState();
      });

      it("gets attachments for a specific transparency", async () => {
        await getTransparencyAttchments(formation);
        expectGdsStoredFiles(formation, ...expectedFiles);
      });
    });
  });

  const givenAMembreCommun = () => givenAUser(Role.MEMBRE_COMMUN);
  const givenAMembreDuSiege = () => givenAUser(Role.MEMBRE_DU_SIEGE);
  const givenAMembreDuParquet = () => givenAUser(Role.MEMBRE_DU_PARQUET);

  const givenAUser = (role: Role) => {
    const user: AuthenticatedUserSM = {
      firstName: "User",
      lastName: "Current",
      role,
      gender: Gender.M,
    };
    store.dispatch(authenticate.fulfilled(user, "", userCredentials));
  };

  const getTransparencyAttchments = (formation: Magistrat.Formation) =>
    store.dispatch(
      getTransparencyAttachmentsFactory<["transpa-test"]>()({
        transparency,
        formation,
      }),
    );

  const expectGdsStoredFiles = (
    formation: Magistrat.Formation,
    ...fileNames: string[]
  ) =>
    expect(store.getState()).toEqual<AppState<true, ["transpa-test"]>>({
      ...initialState,
      transparencies: {
        GDS: {
          [transparency]: {
            files: {
              [Magistrat.Formation.PARQUET]: [],
              [Magistrat.Formation.SIEGE]: [],
              [formation]: fileNames.map((fileName) => ({
                name: fileName,
                signedUrl: `https://example.com/signed-url/${fileName}`,
              })),
            },
          },
        },
      },
    });
});

const userCredentials: AuthenticateParams = {
  email: "user@example.fr",
  password: "password",
};
