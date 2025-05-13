import {
    RestContract
} from "./common";

export interface SecretariatGeneralContextRestContract extends RestContract {
  basePath: "api/secretariat-general";
  endpoints: {
    uploadTransparency: {
      method: "POST";
      path: "transparency";
      body: FormData;
      response: void
    };
  };
}
