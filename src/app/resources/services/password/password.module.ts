import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModel } from 'src/app/database/models/user.model';

import { JwtModule } from '@nestjs/jwt';
import jwtConstants from 'src/app/utils/jwt.constants';
import { EmailModule } from '../email/email.module';
import { PasswordService } from './password.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserModel]),
    EmailModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [PasswordService],
  exports: [PasswordService],
})
export class PasswordModule {}
