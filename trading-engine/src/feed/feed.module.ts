import { Module } from '@nestjs/common';
import { Feed } from './feed';

@Module({
  providers: [Feed]
})
export class FeedModule {}
