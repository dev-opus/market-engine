import { Module } from '@nestjs/common';
import { Arbitrage } from './arbitrage';

@Module({
  providers: [Arbitrage]
})
export class ArbitrageModule {}
