import './instrument';

import { AppModule } from './app.module';

async function bootstrap() {
  return AppModule.listen();
}

bootstrap();
