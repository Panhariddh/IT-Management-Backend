import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { ConfigModule } from 'src/config/config.module';
import { AuthModule } from 'src/shared/modules/auth.module';
import { AppRoutingModule } from './app.route';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
     ConfigModule,
     AuthModule,
     AppRoutingModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
