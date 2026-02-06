import { Module } from '@nestjs/common';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('_health')
export class HealthController {
  @Get()
  getHealth() {}
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
