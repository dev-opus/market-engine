import { Injectable } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';

type ArbitrageOpportunityEvent = {
  buyFrom: string;
  sellTo: string;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  timestamp: number;
};

@Injectable()
export class Execution {
  constructor(private events: EventEmitter2) {}

  @OnEvent('arbitrage.opportunity')
  async executeArbitrage(arbitrage: ArbitrageOpportunityEvent) {
    console.log(
      `Executing arbitrage: Buy from ${arbitrage.buyFrom} at ${arbitrage.buyPrice}, sell to ${arbitrage.sellTo} at ${arbitrage.sellPrice}, expected profit: ${arbitrage.profit}`,
    );

    // Placeholder for actual execution logic
    // e.g., place buy order on buyFrom exchange and sell order on sellTo exchange

    // persistence layer would listen for the 'execution.completed' event to log the execution details
    this.events.emit('execution.completed', {
      ...arbitrage,
      status: 'completed',
    });
  }
}
