import { z } from "zod";

import { Gender } from "../../gender";
import { Magistrat } from "../../magistrat.namespace";
import { Role } from "../../role";
import { type RestContract } from "../common";


export interface UserRestContract extends RestContract {
  basePath: "api/users";
  endpoints: {
    usersByFormation: {
      method: "GET";
      path: "by-formation/:formation";
      params: FormationQueryParamsDto;
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


interface FormationQueryParamsDto extends Record<string, string> {
  formation: Magistrat.Formation;
}

export const formationDtoSchema = z.object({
  formation: z.nativeEnum(Magistrat.Formation),
})


