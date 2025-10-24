import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './infrastructure/sessions.service';

@Module({ controllers: [SessionController], providers: [SessionService] })
export class SessionModule {}
