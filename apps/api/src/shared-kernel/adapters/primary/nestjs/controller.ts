import { RestContract } from 'shared-models/models/endpoints/common';
import type FormDataLib from 'form-data';

export type IController<C extends RestContract> = {
  [K in keyof C['endpoints']]: (
    params: C['endpoints'][K]['params'],
    body: C['endpoints'][K]['body'] extends FormData | FormDataLib
      ? Express.Multer.File
      : C['endpoints'][K]['body'],
  ) => Promise<C['endpoints'][K]['response']>;
};

export type IControllerPaths<C extends RestContract> = {
  [K in keyof C['endpoints']]: C['endpoints'][K]['path'];
};
