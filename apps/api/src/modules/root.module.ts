import { Module } from '@nestjs/common';
import { SimpleAuthModule } from './simple-auth';
import { FrameworkModule } from './framework/framework.module';
import { SessionModule } from './session/session.module';

@Module({ imports: [SimpleAuthModule, SessionModule] })
class FondationModule {}

@Module({ imports: [FrameworkModule, FondationModule] })
export class RootModule {}
