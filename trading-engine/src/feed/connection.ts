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
  private synced = false;
  private lastUpdateId = 0;
  private buffer: DepthEvent[] = [];
  private isReconnecting = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly baseReconnectDelay = 1000; // 1 second

  private bids = new Map<string, string>();
  private asks = new Map<string, string>();

  constructor(
    private readonly baseUrl: string,
    private readonly exchange: string,
    private readonly events: EventEmitter2,
  ) {}

  start() {
    this.connect();
  }

  private connect() {
    if (this.ws) {
      this.ws.removeAllListeners();
      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        this.ws.close();
      }
    }

    const wsUrl = this.baseUrl.replace('http', 'ws') + '/ws';
    console.log(`[${this.exchange}] Connecting to ${wsUrl}...`);

    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      console.log(`[${this.exchange}] WebSocket connected`);
      this.isReconnecting = false;
      this.reconnectAttempts = 0;
      this.synced = false;
      this.buffer = [];
      setTimeout(async () => await this.sync(), 1000);
    });

    this.ws.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString());

      if (this.synced) {
        this.processMessage(msg);
      } else {
        this.buffer.push(msg);
      }
    });

    this.ws.on('error', (error) => {
      console.error(`[${this.exchange}] WebSocket error:`, error);
    });

    this.ws.on('close', (code, reason) => {
      console.log(
        `[${this.exchange}] WebSocket closed (code: ${code}, reason: ${reason.toString()})`,
      );
      this.synced = false;
      this.buffer = [];
      this.attemptReconnect();
    });
  }

  private attemptReconnect() {
    if (this.isReconnecting) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        `[${this.exchange}] Max reconnection attempts reached. Stopping reconnection.`,
      );
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000, // Max 30 seconds
    );

    console.log(
      `[${this.exchange}] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    setTimeout(() => {
      this.isReconnecting = false;
      this.connect();
    }, delay);
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
    this.synced = true;
  }

  private processMessage(event: DepthEvent) {
    // Validate sequence
    if (event.pu !== this.lastUpdateId) {
      console.log(`[${this.exchange}] Out of sequence, resyncing...`);
      this.resync();
      return;
    }

    this.apply(event);
    this.lastUpdateId = event.u;
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
    this.synced = false;
    this.buffer = [];
    await this.sync();
  }
}
