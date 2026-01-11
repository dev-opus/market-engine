import { FeedConnection } from './connection';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class Feed implements OnModuleInit {
  constructor(
    private readonly events: EventEmitter2,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const exchangesAndBaseUrls = this.configService.get<string>(
      'EXCHANGES_AND_BASE_URLS',
    );

    if (!exchangesAndBaseUrls) {
      throw new Error(
        'the EXCHANGES_AND_BASE_URLS env variable must be defined',
      );
    }

    const exchangeAndBaseUrl: Record<string, string> =
      JSON.parse(exchangesAndBaseUrls);

    for (const [exchange, baseUrl] of Object.entries(exchangeAndBaseUrl)) {
      this.start(baseUrl, exchange, this.events);
    }
  }

  private start(baseUrl: string, exchange: string, events: EventEmitter2) {
    const connection = new FeedConnection(baseUrl, exchange, events);
    connection.start();
  }
}
