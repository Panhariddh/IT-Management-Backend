import { Module } from '@nestjs/common';

import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UserModel } from 'src/modules/m2_user/models/user.model';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import jwtConstants from 'src/utils/jwt.constants';
import { JwtStrategy } from '../services/jwt.service';
import { AppRoutingModule } from 'src/app/app.route';

@Module({
  imports: [
    AppRoutingModule,
    TypeOrmModule.forFeature([UserModel]),
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
