import { Global, Module } from '@nestjs/common';
import { RedisService } from './services/redis.service';
import { PrismaService } from './services/prisma.service';

@Global()
@Module({
  providers: [RedisService, PrismaService],
  exports: [RedisService, PrismaService],
})
export class CommonModule {}
