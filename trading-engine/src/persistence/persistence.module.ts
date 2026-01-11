import { Module } from '@nestjs/common';
import { Persistence } from './persistence';

@Module({
  providers: [Persistence]
})
export class PersistenceModule {}
