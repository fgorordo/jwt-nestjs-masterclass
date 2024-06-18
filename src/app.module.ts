import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AccessTokenGuard } from './common/guards';
import { APP_GUARD } from '@nestjs/core';


@Module({
  imports: [AuthModule, PrismaModule, ConfigModule.forRoot()],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: AccessTokenGuard}],
})
export class AppModule {}
