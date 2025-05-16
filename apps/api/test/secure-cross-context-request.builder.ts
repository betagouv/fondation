import { INestApplication } from '@nestjs/common';
import { SystemRequestSignatureProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/service-request-signature.provider';
import { systemRequestHeaderKey } from 'src/shared-kernel/adapters/primary/systemRequestHeaderKey';
import supertest, { Test } from 'supertest';
import TestAgent from 'supertest/lib/agent';

export class SecureCrossContextRequestBuilder {
  protected testAgent: TestAgent;
  protected test: Test;
  protected app: INestApplication;

  constructor(app: INestApplication) {
    this.app = app;
    this.testAgent = supertest(app.getHttpServer());
  }

  withTestedEndpoint(testAgentModifier: (testAgent: TestAgent) => Test) {
    this.test = testAgentModifier(this.testAgent);
    return this;
  }

  request() {
    const systemRequestSignatureProvider = this.app.get(
      SystemRequestSignatureProvider,
    );
    const signedToken = systemRequestSignatureProvider.sign();

    return this.test.set(systemRequestHeaderKey, signedToken);
  }
}
