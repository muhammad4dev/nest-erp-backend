import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { IdentityModule } from '../modules/identity/identity.module';

@Module({
  imports: [
    IdentityModule,
    PassportModule,
    JwtModule.register({
      // Require JWT secret in production; allow dev/test default otherwise
      secret:
        process.env.JWT_SECRET ||
        (process.env.NODE_ENV === 'production'
          ? (() => {
              throw new Error(
                'JWT_SECRET must be set in environment for production.',
              );
            })()
          : 'dev_only_insecure_secret'),
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
