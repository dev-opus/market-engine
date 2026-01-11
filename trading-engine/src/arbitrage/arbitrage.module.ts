import { Module } from '@nestjs/common';
import { Arbitrage } from './arbitrage';
import { RedisService } from './redis';

@Module({
  providers: [Arbitrage, RedisService],
})
export class ArbitrageModule {}
