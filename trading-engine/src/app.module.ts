import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FeedModule } from './feed/feed.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ExecutionModule } from './execution/execution.module';
import { ArbitrageModule } from './arbitrage/arbitrage.module';


@Module({
  imports: [
    FeedModule,
    ExecutionModule,
    ArbitrageModule,
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
  ],
})
export class AppModule {}
