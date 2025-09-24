import { z } from "zod";

import { Gender } from "../../gender";
import { Magistrat } from "../../magistrat.namespace";
import { Role } from "../../role";
import { type RestContract } from "../common";


export interface UserRestContract extends RestContract {
  basePath: "api/auth/users";
  endpoints: {
    usersByFormation: {
      method: "GET";
      path: "by-formation/:formation";
      body: undefined;
      response: User[];
    };
  };
}

export interface User {
  userId: string;
  firstName: string;
  lastName: string;
  role: Role;
  gender: Gender;
}

export const formationDtoSchema = z.object({
  formation: z.nativeEnum(Magistrat.Formation),
})


