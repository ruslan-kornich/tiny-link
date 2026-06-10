import { Module } from '@nestjs/common';
import { RollupRepository } from './rollup.repository';
import { RollupScheduler } from './rollup.scheduler';

@Module({
  providers: [RollupScheduler, RollupRepository],
})
export class RollupModule {}
