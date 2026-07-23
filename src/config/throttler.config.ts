import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

export const throttlerConfig = [
  ThrottlerModule.forRoot([
    {
      name: 'short',
      ttl: 60000,
      limit: 10,
    },
    {
      name: 'medium',
      ttl: 60000,
      limit: 30,
    },
    {
      name: 'long',
      ttl: 60000,
      limit: 100,
    },
  ]),
];

export const throttlerGuards = [
  {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },
];
