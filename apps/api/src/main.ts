import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MainAppConfigurator } from './main.configurator';
import { NestExpressApplication } from '@nestjs/platform-express';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  app.useBodyParser('text', {
    limit: '1Mb',
    type: ['application/xml', 'text/xml', 'text/plain'],
  });

  const configuredApp = new MainAppConfigurator(app)
    .withFilters()
    .withCors()
    .withCookies()
    .configure();
  await configuredApp.listen(process.env.PORT || 3000);
}
bootstrap();
