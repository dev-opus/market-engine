import { ConfigService } from '@nestjs/config';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit {
  private client!: RedisClientType;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not defined');
    }

    this.client = createClient({
      url: redisUrl,
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));

    await this.client.connect();
  }

  getClient(): RedisClientType {
    return this.client;
  }
}
