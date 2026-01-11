import axios from 'axios';
import WebSocket from 'ws';
import { EventEmitter2 } from '@nestjs/event-emitter';

type DepthEvent = {
  U: number;
  u: number;
  pu: number;
  b: [string, string][];
  a: [string, string][];
};

export class FeedConnection {
  private ws!: WebSocket;
  private buffer: DepthEvent[] = [];
  private lastUpdateId = 0;

  private bids = new Map<string, string>();
  private asks = new Map<string, string>();

  constructor(
    private readonly baseUrl: string,
    private readonly exchange: string,
    private readonly events: EventEmitter2,
  ) {}

  start() {
    this.ws = new WebSocket(this.baseUrl.replace('http', 'ws') + '/ws');

    this.ws.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString());
      this.buffer.push(msg.data);
    });

    setTimeout(async () => await this.sync(), 1000);
  }

  private async sync() {
    const { data } = await axios.get(this.baseUrl + '/api/v3/depth');

    this.lastUpdateId = data.lastUpdateId;

    for (const [p, q] of data.bids) this.bids.set(p, q);
    for (const [p, q] of data.asks) this.asks.set(p, q);

    const valid = this.buffer.filter((e) => e.u >= this.lastUpdateId);

    const first = valid.find(
      (e) => e.U <= this.lastUpdateId && e.u >= this.lastUpdateId,
    );

    if (!first) {
      await this.resync();
      return;
    }

    this.apply(first);

    let prev = first.u;

    for (const e of valid.slice(valid.indexOf(first) + 1)) {
      if (e.pu !== prev) {
        await this.resync();
        return;
      }
      this.apply(e);
      prev = e.u;
    }

    this.buffer = [];
  }

  private apply(event: DepthEvent) {
    let changed = false;

    for (const [p, q] of event.b) {
      q === '0' ? this.bids.delete(p) : this.bids.set(p, q);
      changed = true;
    }

    for (const [p, q] of event.a) {
      q === '0' ? this.asks.delete(p) : this.asks.set(p, q);
      changed = true;
    }

    if (changed) {
      this.emit();
    }
  }

  private emit() {
    const bestBid = Math.max(...[...this.bids.keys()].map(Number));
    const bestAsk = Math.min(...[...this.asks.keys()].map(Number));

    this.events.emit('orderbook.update', {
      exchange: this.exchange,
      bestBid,
      bestAsk,
    });
  }

  private async resync() {
    this.buffer = [];
    await this.sync();
  }
}
