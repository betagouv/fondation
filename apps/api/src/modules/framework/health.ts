import { Controller, DynamicModule, Get, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('_health')
export class HealthController {
  @Get()
  getHealth() {}
}

@Module({})
export class HealthModule {
  static register(): DynamicModule {
    // Let's prevent a DOS attack, by exposing this only in tests
    if (process.env.NODE_ENV === 'production') {
      return { module: HealthModule };
    }

    return { module: HealthModule, controllers: [HealthController] };
  }
}
