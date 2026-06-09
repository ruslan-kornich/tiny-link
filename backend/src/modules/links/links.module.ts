import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LinksController } from './links.controller';
import { LinksRepository } from './links.repository';
import { LinksService } from './links.service';

@Module({
  imports: [AuthModule],
  controllers: [LinksController],
  providers: [LinksService, LinksRepository],
  exports: [LinksService],
})
export class LinksModule {}
