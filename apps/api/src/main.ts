import './instrument';
import { AppModule } from './app.module';

function bootstrap() {
  return AppModule.listen();
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
