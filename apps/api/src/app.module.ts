import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { PictogramsModule } from './pictogramas/pictogramas.module.js';
import { validateEnv } from './supabase/env.validation.js';
import { SupabaseModule } from './supabase/supabase.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ClassroomsModule } from './aulas/aulas.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    SupabaseModule,
    PictogramsModule,
    AuthModule,
    ClassroomsModule,
  ],
  controllers: [AppController],
})
export class AppModule { }