import { Module } from '@nestjs/common';
import { FeedModule } from './feed/feed.module';
import { ExecutionModule } from './execution/execution.module';
import { OrderbookModule } from './orderbook/orderbook.module';
import { ArbitrageModule } from './arbitrage/arbitrage.module';
import { PersistenceModule } from './persistence/persistence.module';

@Module({
  imports: [
    FeedModule,
    ExecutionModule,
    OrderbookModule,
    ArbitrageModule,
    PersistenceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
