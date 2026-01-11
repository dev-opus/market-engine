import { Module } from '@nestjs/common';
import { Execution } from './execution';

@Module({
  providers: [Execution]
})
export class ExecutionModule {}
