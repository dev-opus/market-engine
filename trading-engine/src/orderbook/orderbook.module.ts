import { Module } from '@nestjs/common';
import { Orderbook } from './orderbook';

@Module({
  providers: [Orderbook]
})
export class OrderbookModule {}
