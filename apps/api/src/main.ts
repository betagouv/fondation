import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MainAppConfigurator } from './main.configurator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configuredApp = new MainAppConfigurator(app)
    .withCors()
    .withCookies()
    .configure();
  await configuredApp.listen(process.env.PORT || 3000);
}
bootstrap();
