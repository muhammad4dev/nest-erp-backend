import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET ||
        (process.env.NODE_ENV === 'production'
          ? (() => {
              throw new Error(
                'JWT_SECRET must be set in environment for production.',
              );
            })()
          : 'dev_only_insecure_secret'),
    });
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
    };
  }
}
