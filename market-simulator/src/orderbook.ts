import type { Logger } from 'log4js';

export class OrderBook {
  private mid: number;
  private bids: string[][];
  private asks: string[][];
  private lastUpdateId: number;

  private readonly SYMBOL = 'BTCUSDT';

  constructor(private logger: Logger) {
    this.lastUpdateId = 5000;
    this.mid = Number(process.env.MID);
    this.bids = this.generateInitialBook('bid');
    this.asks = this.generateInitialBook('ask');
    this.logger.info('OrderBook initialized');
  }

  generateInitialBook(side: 'bid' | 'ask'): string[][] {
    const book = [];
    const offsets = [0.5, 1.0, 2.0, 3.5, 5.0, 7.5, 10.0, 15.0, 20.0, 30.0];

    for (let i = 0; i < offsets.length; i++) {
      const offset = offsets[i];
      const price =
        side === 'bid'
          ? (this.mid - offset).toFixed(2)
          : (this.mid + offset).toFixed(2);
      const quantity = (Math.random() * 2 + 0.5).toFixed(5);
      book.push([price, quantity]);
    }

    return book;
  }

  getSnapshot() {
    this.logger.info('Providing order book snapshot');
    return {
      lastUpdateId: this.lastUpdateId,
      bids: [...this.bids].sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])),
      asks: [...this.asks].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])),
    };
  }

  generateUpdate() {
    this.logger.info('Generating order book update');
    const previousUpdateId = this.lastUpdateId;
    this.lastUpdateId++;

    const updatedBids = [];
    const updatedAsks = [];

    if (Math.random() < 0.3) {
      // Only 30% of updates
      const midMove = (Math.random() - 0.5) * 2.0;
      this.mid += midMove;

      // Rebuild around new mid
      this.bids = this.generateInitialBook('bid');
      this.asks = this.generateInitialBook('ask');
    }

    // Randomly reduce 1-2 sizes on bids
    for (let i = 0; i < Math.min(2, this.bids.length); i++) {
      if (Math.random() < 0.6) {
        const idx = Math.floor(Math.random() * this.bids.length);
        const [price, qty] = this.bids[idx];
        const newQty = (parseFloat(qty) * (0.5 + Math.random() * 0.4)).toFixed(
          5
        );
        this.bids[idx] = [price, newQty];
        updatedBids.push([price, newQty]);
      }
    }

    // Randomly reduce 1-2 sizes on asks
    for (let i = 0; i < Math.min(2, this.asks.length); i++) {
      if (Math.random() < 0.6) {
        const idx = Math.floor(Math.random() * this.asks.length);
        const [price, qty] = this.asks[idx];
        const newQty = (parseFloat(qty) * (0.5 + Math.random() * 0.4)).toFixed(
          5
        );
        this.asks[idx] = [price, newQty];
        updatedAsks.push([price, newQty]);
      }
    }

    // Sometimes delete a level (20% chance)
    if (Math.random() < 0.2 && this.bids.length > 5) {
      const idx = Math.floor(Math.random() * this.bids.length);
      const [price] = this.bids[idx];
      this.bids.splice(idx, 1);
      updatedBids.push([price, '0.00000000']);
    }

    if (Math.random() < 0.2 && this.asks.length > 5) {
      const idx = Math.floor(Math.random() * this.asks.length);
      const [price] = this.asks[idx];
      this.asks.splice(idx, 1);
      updatedAsks.push([price, '0.00000000']);
    }

    // Sometimes add a new level (15% chance)
    if (Math.random() < 0.15) {
      const offset = Math.random() * 25 + 1;
      const price = (this.mid - offset).toFixed(2);
      const qty = (Math.random() * 2 + 0.5).toFixed(5);
      this.bids.push([price, qty]);
      updatedBids.push([price, qty]);
    }

    if (Math.random() < 0.15) {
      const offset = Math.random() * 25 + 1;
      const price = (this.mid + offset).toFixed(2);
      const qty = (Math.random() * 2 + 0.5).toFixed(5);
      this.asks.push([price, qty]);
      updatedAsks.push([price, qty]);
    }

    return {
      e: 'depthUpdate',
      E: Date.now(),
      s: this.SYMBOL,
      U: this.lastUpdateId,
      u: this.lastUpdateId,
      pu: previousUpdateId,
      b: updatedBids,
      a: updatedAsks,
    };
  }
}
