import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { InternalOpenIdService } from './internal/openid.service';
import { internalOpenIdTokens } from './internal/openid.tokens';
import { OpenIdProvider } from './openid.provider';

@Injectable()
export class OpenId {
  constructor(private readonly modules: ModuleRef) {}

  for(providerId: OpenIdProvider): InternalOpenIdService {
    return this.modules.get<InternalOpenIdService>(internalOpenIdTokens.client(providerId));
  }
}
