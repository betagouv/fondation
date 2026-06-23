import { Param } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import z from 'zod';

import { OPENID_PROVIDERS } from './openid.provider';

const OpenIdProviderSchema = z.enum(OPENID_PROVIDERS);

export function OpenIdProviderParam(name = 'provider'): ParameterDecorator {
  return Param(name, new ZodValidationPipe(OpenIdProviderSchema));
}
