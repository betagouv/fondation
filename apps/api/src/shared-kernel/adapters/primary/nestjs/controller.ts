import { RestContract } from 'shared-models';
import type FormDataLib from 'form-data';
import { Response } from 'express';

export type IController<C extends RestContract> = {
  [K in keyof C['endpoints']]: (
    params: C['endpoints'][K]['params'],
    body: C['endpoints'][K]['body'] extends FormData | FormDataLib
      ? Express.Multer.File
      : C['endpoints'][K]['body'],
    query: C['endpoints'][K]['queryParams'],
    ...args: any[]
  ) =>
    | Promise<C['endpoints'][K]['response']>
    | Promise<Response<C['endpoints'][K]['response'], Record<string, any>>>;
};

export type IControllerPaths<C extends RestContract> = {
  [K in keyof C['endpoints']]: C['endpoints'][K]['path'];
};
