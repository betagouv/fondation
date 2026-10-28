import { Injectable, MiddlewareConsumer, Module, NestMiddleware, NestModule } from '@nestjs/common';
import { type NextFunction, type Request, type Response } from 'express';

@Injectable()
class SecurityHeadersMiddleware implements NestMiddleware {
  use(_req: Request, res: Response, next: NextFunction): void {
    // the stored files are served inline from this origin: none of their scripts may run
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  }
}

@Module({})
export class SecurityHeadersModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Swagger UI, served outside production only, runs its own scripts
    consumer.apply(SecurityHeadersMiddleware).exclude('openapi', 'openapi/*path').forRoutes('*all');
  }
}
