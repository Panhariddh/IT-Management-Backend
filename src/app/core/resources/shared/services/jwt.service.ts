import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserModel } from 'src/app/database/models/user.model';
import jwtConstants from 'src/app/utils/jwt.constants';



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
        'image',
        'name_kh',
        'name_en',
        'email',
        'phone',
        'gender',
        'dob',
        'address',
        'role',
        'is_active',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Unauthorized - User not found or inactive.');
    }

    return user;
  }
}