import { Module } from '@nestjs/common';
import { FrameworkModule } from './framework/framework.module';
import { SessionModule } from './session/session.module';
import { SimpleAuthModule } from './simple-auth';

@Module({ imports: [SimpleAuthModule, SessionModule] })
class FondationModule {}

@Module({ imports: [FrameworkModule, FondationModule] })
export class RootModule {}
