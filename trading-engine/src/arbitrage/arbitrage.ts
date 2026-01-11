import { Injectable } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from './redis';

type OrderBookUpdateEvent = {
  exchange: string;
  bestBid: number;
  bestAsk: number;
};

@Injectable()
export class Arbitrage {
  private books = new Map<string, { bid: number; ask: number }>();
  constructor(
    private events: EventEmitter2,
    private redis: RedisService,
  ) {}

  @OnEvent('orderbook.update')
  async onUpdate(update: OrderBookUpdateEvent) {
    this.books.set(update.exchange, {
      bid: update.bestBid,
      ask: update.bestAsk,
    });
    await this.checkArbitrage();
  }

  private async checkArbitrage() {
    if (this.books.size < 2) return;

    let bestBuy = { ex: '', price: Infinity };
    let bestSell = { ex: '', price: -Infinity };

    for (const [ex, book] of this.books) {
      if (book.ask < bestBuy.price) {
        bestBuy = { ex, price: book.ask };
      }
      if (book.bid > bestSell.price) {
        bestSell = { ex, price: book.bid };
      }
    }

    const fingerprint = `buy:${bestBuy.ex}-sell:${bestSell.ex}-buyPrice:${bestBuy.price}-sellPrice:${bestSell.price}`;
    const redisClient = this.redis.getClient();
    const exists = await redisClient.get(fingerprint);
    if (exists) {
      console.log('Arbitrage opportunity already processed recently');
      return;
    }
    await redisClient.set(fingerprint, '1', { EX: 60 });

    // Guard against no valid prices found
    if (bestBuy.price === Infinity || bestSell.price === -Infinity) return;
    const profit = bestSell.price - bestBuy.price;

    if (profit > 0.5) {
      const opportunity = {
        buyFrom: bestBuy.ex,
        sellTo: bestSell.ex,
        buyPrice: bestBuy.price,
        sellPrice: bestSell.price,
        profit,
        timestamp: Date.now(),
      };

      this.events.emit('arbitrage.opportunity', opportunity);
    }
  }
}
