import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import type { EnvVars } from './supabase/env.validation.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const config = app.get(ConfigService<EnvVars, true>);
  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
