import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserModel } from 'src/modules/m2_user/models/user.model';
import jwtConstants from 'src/utils/jwt.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UserModel)
    private userRepository: Repository<UserModel>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          let token = null;
          if (req && req.cookies) {
            token = req.cookies['jwt'];
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: { userId: string }) {
    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
      select: [
        'id',
        'name',
        'stuId',
        'email',
        'phone',
        'gender',
        'address',
        'dob',
        'year',
        'emergencyContact',
        'role',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Unauthorized - User Not Found.');
    }

    return user;
  }
}
